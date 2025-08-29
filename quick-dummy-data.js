// Point Art Hub - Essential Dummy Data
// Quick script to add sample data to the main modules

async function addEssentialData() {
  console.log('🎯 Adding Essential Dummy Data...');
  
  if (!window.supabase) {
    console.error('❌ Supabase not found');
    return;
  }

  // Check login
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.error('❌ Please log in first');
    return;
  }

  console.log('✅ Adding data for:', session.user.email);

  try {
    // 1. STATIONERY (5 items)
    console.log('📝 Adding Stationery...');
    await window.supabase.from('stationery').insert([
      {
        category: "Office Supplies", item: "A4 Copy Paper", description: "White copy paper 500 sheets",
        quantity: 50, rate: 15000, selling_price: 18000, profit_per_unit: 3000, 
        low_stock_threshold: 10, stock: 50
      },
      {
        category: "Writing Instruments", item: "Blue Pens Pack", description: "Pack of 12 blue pens",
        quantity: 100, rate: 500, selling_price: 800, profit_per_unit: 300,
        low_stock_threshold: 20, stock: 100
      },
      {
        category: "School Supplies", item: "Exercise Books", description: "A5 lined books 80 pages",
        quantity: 200, rate: 1200, selling_price: 1500, profit_per_unit: 300,
        low_stock_threshold: 50, stock: 200
      },
      {
        category: "Art Materials", item: "Colored Pencils", description: "24-color pencil set",
        quantity: 30, rate: 8000, selling_price: 12000, profit_per_unit: 4000,
        low_stock_threshold: 5, stock: 30
      },
      {
        category: "Desk Accessories", item: "Heavy Duty Stapler", description: "Metal stapler for office",
        quantity: 15, rate: 25000, selling_price: 35000, profit_per_unit: 10000,
        low_stock_threshold: 3, stock: 15
      }
    ]);

    // 2. GIFT STORE (5 items)
    console.log('🎁 Adding Gift Store...');
    await window.supabase.from('gift_store').insert([
      {
        item: "Scented Candles", category: "birthday", quantity: 25, rate: 5000,
        selling_price: 8000, profit_per_unit: 3000, low_stock_threshold: 5,
        stock: 25, sales: 0, date: new Date().toISOString()
      },
      {
        item: "Toy Cars Set", category: "kids_toys", quantity: 40, rate: 12000,
        selling_price: 18000, profit_per_unit: 6000, low_stock_threshold: 8,
        stock: 40, sales: 0, date: new Date().toISOString()
      },
      {
        item: "All-Purpose Cleaner", category: "cleaning", quantity: 60, rate: 8000,
        selling_price: 12000, profit_per_unit: 4000, low_stock_threshold: 15,
        stock: 60, sales: 0, date: new Date().toISOString()
      },
      {
        item: "Party Balloons", category: "birthday", quantity: 100, rate: 500,
        selling_price: 1000, profit_per_unit: 500, low_stock_threshold: 20,
        stock: 100, sales: 0, date: new Date().toISOString()
      },
      {
        item: "Handmade Jewelry", category: "custom", custom_category: "Accessories",
        quantity: 15, rate: 20000, selling_price: 35000, profit_per_unit: 15000,
        low_stock_threshold: 3, stock: 15, sales: 0, date: new Date().toISOString()
      }
    ]);

    // 3. EMBROIDERY (4 jobs)
    console.log('🧵 Adding Embroidery...');
    await window.supabase.from('embroidery').insert([
      {
        job_description: "Logo embroidery on 50 polo shirts for ABC Company",
        quotation: 250000, deposit: 100000, balance: 150000, quantity: 50,
        rate: 5000, expenditure: 180000, profit: 70000, sales: 0,
        date: new Date().toISOString()
      },
      {
        job_description: "School uniform name tags and crest embroidery",
        quotation: 150000, deposit: 50000, balance: 100000, quantity: 30,
        rate: 5000, expenditure: 90000, profit: 60000, sales: 0,
        date: new Date().toISOString()
      },
      {
        job_description: "Wedding dress embroidery with beadwork",
        quotation: 500000, deposit: 200000, balance: 300000, quantity: 1,
        rate: 500000, expenditure: 300000, profit: 200000, sales: 0,
        date: new Date().toISOString()
      },
      {
        job_description: "Restaurant apron embroidery - 20 pieces",
        quotation: 120000, deposit: 60000, balance: 60000, quantity: 20,
        rate: 6000, expenditure: 80000, profit: 40000, sales: 0,
        date: new Date().toISOString()
      }
    ]);

    console.log('🎉 SUCCESS! Added sample data to all main modules.');
    console.log('📊 Data Summary:');
    console.log('   📝 Stationery: 5 items');
    console.log('   🎁 Gift Store: 5 items');
    console.log('   🧵 Embroidery: 4 jobs');
    console.log('');
    console.log('🔄 Refresh the page to see your new data!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Auto-run
window.addEssentialData = addEssentialData;
console.log('✨ Essential Dummy Data Script Ready!');
console.log('Run: addEssentialData()');