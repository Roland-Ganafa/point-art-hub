import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GiftDailySale {
  id: string;
  date: string; // ISO date
  item: string;
  code: string | null;
  quantity: number;
  unit: string;
  bpx: number;
  spx: number;
  created_at?: string;
}

const formatUGX = (n: number | null | undefined) => {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n);
};

const startEndOfMonth = (yyyymm: string) => {
  const [y, m] = yyyymm.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, 1);
  const end = new Date(y, (m ?? 1), 1); // first day of next month
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISO(start), end: toISO(end) };
};

const GiftsDailySales = () => {
  const { toast } = useToast();
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState<GiftDailySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    item: "",
    code: "",
    quantity: "1",
    unit: "Pc",
    bpx: "",
    spx: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const { start, end } = startEndOfMonth(month);
    const { data, error } = await supabase
      .from("gift_daily_sales")
      .select("*")
      .gte("date", start)
      .lt("date", end)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    setLoading(false);
    if (error) {
      toast({ title: "Error fetching daily sales", description: error.message, variant: "destructive" });
    } else {
      setItems((data as GiftDailySale[]) || []);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const grouped = useMemo(() => {
    const map: Record<string, GiftDailySale[]> = {};
    for (const r of items) {
      (map[r.date] ||= []).push(r);
    }
    return map;
  }, [items]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, r) => {
        acc.bpx += Number(r.bpx || 0) * Number(r.quantity || 0) / Number(r.quantity || 1); // per-row value already bpx
        acc.spx += Number(r.spx || 0);
        return acc;
      },
      { bpx: 0, spx: 0 }
    );
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date: formData.date,
      item: formData.item,
      code: formData.code || null,
      quantity: parseInt(formData.quantity || "1", 10),
      unit: formData.unit,
      bpx: parseFloat(formData.bpx || "0"),
      spx: parseFloat(formData.spx || "0"),
    };
    const { error } = await supabase.from("gift_daily_sales").insert([payload]);
    if (error) {
      toast({ title: "Error saving entry", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Daily sale added" });
      setFormData({
        date: formData.date,
        item: "",
        code: "",
        quantity: "1",
        unit: formData.unit,
        bpx: "",
        spx: "",
      });
      fetchData();
    }
  };

  const exportCSV = () => {
    if (!items.length) return;
    const headers = ["date","item","code","quantity","unit","bpx","spx"];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = items.map(r => headers.map(h => escape((r as any)[h])).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gifts-daily-sales-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <Label htmlFor="month">Month</Label>
          <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Daily Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <Input placeholder="Item" value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} />
            <Input placeholder="Code / Description" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <Input type="number" placeholder="Qty" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pc">Pc</SelectItem>
                <SelectItem value="Pcs">Pcs</SelectItem>
                <SelectItem value="Set">Set</SelectItem>
                <SelectItem value="Dozen">Dozen</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" step="0.01" placeholder="BPX (UGX)" value={formData.bpx} onChange={(e) => setFormData({ ...formData, bpx: e.target.value })} />
            <div className="flex gap-2">
              <Input className="flex-1" type="number" step="0.01" placeholder="SPX (UGX)" value={formData.spx} onChange={(e) => setFormData({ ...formData, spx: e.target.value })} />
              <Button type="submit">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gifts Daily Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Code / Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>BPX (UGX)</TableHead>
                <TableHead>SPX (UGX)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(grouped).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {loading ? "Loading..." : "No entries yet for this month."}
                  </TableCell>
                </TableRow>
              )}
              {Object.entries(grouped).map(([d, rows]) => {
                const sub = rows.reduce((acc, r) => ({
                  bpx: acc.bpx + Number(r.bpx || 0),
                  spx: acc.spx + Number(r.spx || 0),
                }), { bpx: 0, spx: 0 });
                return (
                  <>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell className="font-medium">{r.item}</TableCell>
                        <TableCell>{r.code || "-"}</TableCell>
                        <TableCell>{`${r.quantity}${r.unit ? r.unit : ""}`}</TableCell>
                        <TableCell>{`UGX ${formatUGX(r.bpx)}`}</TableCell>
                        <TableCell className="font-semibold">{`UGX ${formatUGX(r.spx)}`}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">Sub total</TableCell>
                      <TableCell className="font-medium">{`UGX ${formatUGX(sub.bpx)}`}</TableCell>
                      <TableCell className="font-semibold">{`UGX ${formatUGX(sub.spx)}`}</TableCell>
                    </TableRow>
                  </>
                );
              })}
              {items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-bold">Grand Total</TableCell>
                  <TableCell className="font-bold">{`UGX ${formatUGX(items.reduce((a,b)=>a+Number(b.bpx||0),0))}`}</TableCell>
                  <TableCell className="font-bold">{`UGX ${formatUGX(items.reduce((a,b)=>a+Number(b.spx||0),0))}`}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftsDailySales;
