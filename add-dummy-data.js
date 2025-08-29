// Point Art Hub - Dummy Data Generator
// Run this script in the browser console when logged in to populate the database with sample data

async function addDummyData() {
  console.log('🎯 Point Art Hub - Adding Dummy Data...');
  console.log('=====================================');

  if (!window.supabase) {
    console.error('❌ Supabase not found. Make sure you\'re on the Point Art Hub website.');
    return;
  }

  try {
    // Check if user is logged in
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ Please log in first before adding dummy data');
      return;
    }

    console.log('✅ Logged in as:', session.user.email);

    // 1. STATIONERY DATA
    console.log('\n📝 Adding Stationery Items...');
    const stationeryItems = [
      {
        category: "Office Supplies",
        item: "A4 Copy Paper",
        description: "High-quality white copy paper, 500 sheets per ream",
        quantity: 50,
        rate: 15000,
        selling_price: 18000,
        profit_per_unit: 3000,
        low_stock_threshold: 10,
        stock: 50,
        sold_by: null
      },
      {
        category: "Writing Instruments",
        item: "Blue Ballpoint Pens",
        description: "Smooth writing blue ink pens, pack of 12",
        quantity: 100,
        rate: 500,
        selling_price: 800,
        profit_per_unit: 300,
        low_stock_threshold: 20,
        stock: 100,
        sold_by: null
      },
      {
        category: "School Supplies",
        item: "Exercise Books A5",
        description: "Lined exercise books for students, 80 pages",
        quantity: 200,
        rate: 1200,
        selling_price: 1500,
        profit_per_unit: 300,
        low_stock_threshold: 50,
        stock: 200,
        sold_by: null
      },
      {
        category: "Art Materials",
        item: "Colored Pencils Set",
        description: "24-color pencil set for drawing and coloring",
        quantity: 30,
        rate: 8000,
        selling_price: 12000,
        profit_per_unit: 4000,
        low_stock_threshold: 5,
        stock: 30,
        sold_by: null
      },
      {
        category: "Desk Accessories",
        item: "Stapler Heavy Duty",
        description: "Metal stapler for office use, staples up to 20 sheets",
        quantity: 15,
        rate: 25000,
        selling_price: 35000,
        profit_per_unit: 10000,
        low_stock_threshold: 3,
        stock: 15,
        sold_by: null
      }
    ];

    const { error: stationeryError } = await window.supabase
      .from('stationery')
      .insert(stationeryItems);

    if (stationeryError) {
      console.error('❌ Stationery error:', stationeryError);
    } else {
      console.log('✅ Added', stationeryItems.length, 'stationery items');
    }

    // 2. GIFT STORE DATA
    console.log('\n🎁 Adding Gift Store Items...');
    const giftStoreItems = [
      {
        item: "Scented Candles",
        category: "birthday",
        custom_category: null,
        quantity: 25,
        rate: 5000,
        selling_price: 8000,
        profit_per_unit: 3000,
        low_stock_threshold: 5,
        stock: 25,
        sales: 0,
        sold_by: null,
        date: new Date().toISOString()
      },
      {
        item: "Toy Cars Set",
        category: "kids_toys",
        custom_category: null,
        quantity: 40,
        rate: 12000,
        selling_price: 18000,
        profit_per_unit: 6000,
        low_stock_threshold: 8,
        stock: 40,
        sales: 0,
        sold_by: null,
        date: new Date().toISOString()
      },
      {
        item: "All-Purpose Cleaner",
        category: "cleaning",
        custom_category: null,
        quantity: 60,
        rate: 8000,
        selling_price: 12000,
        profit_per_unit: 4000,
        low_stock_threshold: 15,
        stock: 60,
        sales: 0,
        sold_by: null,
        date: new Date().toISOString()
      },
      {
        item: "Birthday Party Balloons",
        category: "birthday",
        custom_category: null,
        quantity: 100,
        rate: 500,
        selling_price: 1000,
        profit_per_unit: 500,
        low_stock_threshold: 20,
        stock: 100,
        sales: 0,
        sold_by: null,
        date: new Date().toISOString()
      },
      {
        item: "Handmade Jewelry",
        category: "custom",
        custom_category: "Accessories",
        quantity: 15,
        rate: 20000,
        selling_price: 35000,
        profit_per_unit: 15000,
        low_stock_threshold: 3,
        stock: 15,
        sales: 0,
        sold_by: null,
        date: new Date().toISOString()
      }
    ];

    const { error: giftError } = await window.supabase
      .from('gift_store')
      .insert(giftStoreItems);

    if (giftError) {
      console.error('❌ Gift store error:', giftError);
    } else {
      console.log('✅ Added', giftStoreItems.length, 'gift store items');
    }

    // 3. EMBROIDERY DATA
    console.log('\n🧵 Adding Embroidery Jobs...');
    const embroideryJobs = [
      {
        job_description: "Custom logo embroidery on 50 polo shirts for ABC Company",
        quotation: 250000,
        deposit: 100000,
        balance: 150000,
        quantity: 50,
        rate: 5000,
        expenditure: 180000,
        profit: 70000,
        sales: 0,
        done_by: null,
        date: new Date().toISOString()
      },
      {
        job_description: "School uniform embroidery - name tags and school crest",
        quotation: 150000,
        deposit: 50000,
        balance: 100000,
        quantity: 30,
        rate: 5000,
        expenditure: 90000,
        profit: 60000,
        sales: 0,
        done_by: null,
        date: new Date().toISOString()
      },
      {
        job_description: "Wedding dress embroidery with beadwork",
        quotation: 500000,
        deposit: 200000,
        balance: 300000,
        quantity: 1,
        rate: 500000,
        expenditure: 300000,
        profit: 200000,
        sales: 0,
        done_by: null,
        date: new Date().toISOString()
      },
      {
        job_description: "Restaurant staff uniform embroidery - 20 aprons",
        quotation: 120000,
        deposit: 60000,
        balance: 60000,
        quantity: 20,
        rate: 6000,
        expenditure: 80000,
        profit: 40000,
        sales: 0,
        done_by: null,
        date: new Date().toISOString()
      }
    ];

    const { error: embroideryError } = await window.supabase
      .from('embroidery')
      .insert(embroideryJobs);

    if (embroideryError) {
      console.error('❌ Embroidery error:', embroideryError);
    } else {
      console.log('✅ Added', embroideryJobs.length, 'embroidery jobs');
    }

    // 4. MACHINES DATA (if table exists)
    console.log('\n🔧 Adding Machine Records...');
    const machineRecords = [
      {
        machine_name: "Brother Embroidery Machine XM2701",
        machine_type: "Embroidery",
        status: "operational",
        purchase_date: "2023-01-15",
        purchase_price: 2500000,
        maintenance_cost: 50000,
        last_maintenance: "2024-01-15",
        next_maintenance: "2024-07-15",
        description: "High-speed computerized embroidery machine with 27 built-in stitches",
        location: "Main Workshop"
      },
      {
        machine_name: "Canon PIXMA Printer",
        machine_type: "Printing",
        status: "operational",
        purchase_date: "2023-06-10",
        purchase_price: 800000,
        maintenance_cost: 25000,
        last_maintenance: "2024-06-10",
        next_maintenance: "2024-12-10",
        description: "Professional inkjet printer for high-quality prints",
        location: "Office"
      },
      {
        machine_name: "Industrial Sewing Machine",
        machine_type: "Sewing",
        status: "maintenance",
        purchase_date: "2022-11-20",
        purchase_price: 1200000,
        maintenance_cost: 75000,
        last_maintenance: "2024-02-20",
        next_maintenance: "2024-08-20",
        description: "Heavy-duty sewing machine for thick fabrics and leather",
        location: "Workshop Area B"
      }
    ];

    const { error: machineError } = await window.supabase
      .from('machines')
      .insert(machineRecords);

    if (machineError) {
      console.warn('⚠️ Machines table might not exist:', machineError.message);
    } else {
      console.log('✅ Added', machineRecords.length, 'machine records');
    }

    // 5. ART SERVICES DATA (if table exists)
    console.log('\n🎨 Adding Art Service Records...');
    const artServices = [
      {
        service_name: "Custom Portrait Painting",
        service_type: "Painting",
        client_name: "Sarah Johnson",
        description: "Oil painting portrait from photograph, 16x20 inches",
        quotation: 350000,
        deposit: 150000,
        balance: 200000,
        status: "in_progress",
        start_date: "2024-01-10",
        completion_date: "2024-02-10",
        materials_cost: 80000,
        labor_cost: 120000,
        profit: 150000
      },
      {
        service_name: "Wedding Invitation Design",
        service_type: "Graphic Design",
        client_name: "Michael & Lisa Wedding",
        description: "Custom wedding invitation design with printing for 200 pieces",
        quotation: 180000,
        deposit: 90000,
        balance: 90000,
        status: "completed",
        start_date: "2024-01-05",
        completion_date: "2024-01-20",
        materials_cost: 45000,
        labor_cost: 60000,
        profit: 75000
      },
      {
        service_name: "Company Logo Design",
        service_type: "Graphic Design",
        client_name: "TechStart Solutions",
        description: "Complete brand identity package with logo variations",
        quotation: 400000,
        deposit: 200000,
        balance: 200000,
        status: "pending",
        start_date: "2024-02-01",
        completion_date: "2024-02-28",
        materials_cost: 20000,
        labor_cost: 180000,
        profit: 200000
      }
    ];

    const { error: artError } = await window.supabase
      .from('art_services')
      .insert(artServices);

    if (artError) {
      console.warn('⚠️ Art services table might not exist:', artError.message);
    } else {
      console.log('✅ Added', artServices.length, 'art service records');
    }

    // Summary
    console.log('\n🎉 DUMMY DATA ADDITION COMPLETE!');
    console.log('================================');
    console.log('✅ Stationery: 5 items added');
    console.log('✅ Gift Store: 5 items added');
    console.log('✅ Embroidery: 4 jobs added');
    console.log('✅ Machines: 3 records added (if table exists)');
    console.log('✅ Art Services: 3 records added (if table exists)');
    console.log('');
    console.log('🔄 Refresh the page to see the new data in your modules!');
    console.log('');
    console.log('💡 Note: Some tables might not exist yet - that\'s normal.');
    console.log('   The core modules (Stationery, Gifts, Embroidery) should have data.');

  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
  }
}

// Auto-run function
console.log('🚀 Dummy Data Generator Loaded!');
console.log('Run: addDummyData() to populate your database');
console.log('');

// Export function to window for easy access
window.addDummyData = addDummyData;