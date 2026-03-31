/**
 * In-memory mock database for demo/development without PostgreSQL.
 * Implements the same query interface as pg Pool.
 */

const bcrypt = require("bcrypt");

// ── Seed Data ──────────────────────────────────────────────

const categories = [
  { category_id: 1, name: "Motorhomes" },
  { category_id: 2, name: "Caravan Trailers" },
  { category_id: 3, name: "Camping Accessories" },
  { category_id: 4, name: "Outdoor Gear" },
];

const products = [
  // Motorhomes
  {
    product_id: 1, category_id: 1, name: "Voyager X500",
    model: "X500", serial_number: "VX500-001",
    description: "Premium motorhome with spacious interior, fully equipped kitchen, and panoramic windows. Perfect for long road trips with the whole family.",
    quantity_in_stocks: 3, base_price: 85000, current_price: 79900,
    warranty_status: "2 years", distributor_info: "Caravan Palace Direct",
    berth_count: 6, fuel_type: "Diesel", weight_kg: 3500, has_kitchen: true,
    discount_rate: 0.06, popularity: 95, image_url: "voyager_x500",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 2, category_id: 1, name: "NomadLux 300",
    model: "NL300", serial_number: "NL300-001",
    description: "Compact luxury motorhome designed for couples. Features a queen-size bed, mini kitchen, and smart storage solutions.",
    quantity_in_stocks: 5, base_price: 62000, current_price: 58500,
    warranty_status: "2 years", distributor_info: "Caravan Palace Direct",
    berth_count: 2, fuel_type: "Diesel", weight_kg: 2800, has_kitchen: true,
    discount_rate: 0.05, popularity: 88, image_url: "nomadlux_300",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 3, category_id: 1, name: "Explorer Pro 700",
    model: "EP700", serial_number: "EP700-001",
    description: "The ultimate adventure motorhome. Off-road capable with solar panels, water tanks, and rugged exterior. Built for the wilderness.",
    quantity_in_stocks: 2, base_price: 120000, current_price: 110000,
    warranty_status: "3 years", distributor_info: "Caravan Palace Direct",
    berth_count: 4, fuel_type: "Diesel", weight_kg: 4200, has_kitchen: true,
    discount_rate: 0.08, popularity: 92, image_url: "explorer_pro_700",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 4, category_id: 1, name: "CityVan Mini",
    model: "CVM", serial_number: "CVM-001",
    description: "Agile urban campervan perfect for city exploration and weekend getaways. Easy to park and fuel-efficient.",
    quantity_in_stocks: 0, base_price: 38000, current_price: 35900,
    warranty_status: "1 year", distributor_info: "Caravan Palace Direct",
    berth_count: 2, fuel_type: "Petrol", weight_kg: 1800, has_kitchen: false,
    discount_rate: 0.05, popularity: 78, image_url: "cityvan_mini",
    created_at: new Date(), updated_at: new Date()
  },
  // Caravan Trailers
  {
    product_id: 5, category_id: 2, name: "Trailmaster 450",
    model: "TM450", serial_number: "TM450-001",
    description: "Spacious caravan trailer with modern interior, air conditioning, and awning. Ideal for seasonal camping.",
    quantity_in_stocks: 7, base_price: 32000, current_price: 29900,
    warranty_status: "2 years", distributor_info: "TrailCo Partners",
    berth_count: 4, fuel_type: "N/A", weight_kg: 1400, has_kitchen: true,
    discount_rate: 0.06, popularity: 85, image_url: "trailmaster_450",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 6, category_id: 2, name: "FamilyGlide 600",
    model: "FG600", serial_number: "FG600-001",
    description: "Family-sized caravan with bunk beds, full bathroom, and generous living space. Your home on wheels.",
    quantity_in_stocks: 4, base_price: 45000, current_price: 42000,
    warranty_status: "2 years", distributor_info: "TrailCo Partners",
    berth_count: 6, fuel_type: "N/A", weight_kg: 1800, has_kitchen: true,
    discount_rate: 0.07, popularity: 90, image_url: "familyglide_600",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 7, category_id: 2, name: "CompactTrail 200",
    model: "CT200", serial_number: "CT200-001",
    description: "Lightweight and easy to tow. Perfect starter caravan for first-time buyers. Includes basic amenities.",
    quantity_in_stocks: 10, base_price: 18000, current_price: 16500,
    warranty_status: "1 year", distributor_info: "TrailCo Partners",
    berth_count: 2, fuel_type: "N/A", weight_kg: 900, has_kitchen: false,
    discount_rate: 0.08, popularity: 72, image_url: "compacttrail_200",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 8, category_id: 2, name: "LuxTrail 800",
    model: "LT800", serial_number: "LT800-001",
    description: "Premium luxury trailer with marble countertops, leather upholstery, and integrated entertainment system.",
    quantity_in_stocks: 0, base_price: 75000, current_price: 69900,
    warranty_status: "3 years", distributor_info: "TrailCo Partners",
    berth_count: 4, fuel_type: "N/A", weight_kg: 2200, has_kitchen: true,
    discount_rate: 0.07, popularity: 82, image_url: "luxtrail_800",
    created_at: new Date(), updated_at: new Date()
  },
  // Camping Accessories
  {
    product_id: 9, category_id: 3, name: "Solar Panel Kit 200W",
    model: "SP200", serial_number: "SP200-001",
    description: "Portable 200W solar panel kit with charge controller. Keep your caravan powered anywhere off-grid.",
    quantity_in_stocks: 25, base_price: 450, current_price: 399,
    warranty_status: "1 year", distributor_info: "SunPower Accessories",
    berth_count: 0, fuel_type: "N/A", weight_kg: 8, has_kitchen: false,
    discount_rate: 0.11, popularity: 94, image_url: "solar_panel_kit",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 10, category_id: 3, name: "Caravan Awning Pro",
    model: "AWN-P", serial_number: "AWN-P-001",
    description: "Retractable all-weather awning with UV protection. Extends your living space outdoors. Easy one-person setup.",
    quantity_in_stocks: 15, base_price: 680, current_price: 599,
    warranty_status: "2 years", distributor_info: "SunPower Accessories",
    berth_count: 0, fuel_type: "N/A", weight_kg: 12, has_kitchen: false,
    discount_rate: 0.12, popularity: 87, image_url: "caravan_awning",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 11, category_id: 3, name: "Portable BBQ Grill",
    model: "BBQ-X", serial_number: "BBQ-X-001",
    description: "Compact stainless steel BBQ grill designed for caravan life. Foldable legs and wind guards included.",
    quantity_in_stocks: 30, base_price: 189, current_price: 159,
    warranty_status: "1 year", distributor_info: "CampGear Co",
    berth_count: 0, fuel_type: "Propane", weight_kg: 5, has_kitchen: false,
    discount_rate: 0.16, popularity: 91, image_url: "portable_bbq",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 12, category_id: 3, name: "Water Purifier System",
    model: "WPS-1", serial_number: "WPS-1-001",
    description: "Advanced water filtration system for caravans. Removes 99.9% of bacteria and heavy metals. Easy to install.",
    quantity_in_stocks: 0, base_price: 320, current_price: 289,
    warranty_status: "2 years", distributor_info: "CampGear Co",
    berth_count: 0, fuel_type: "N/A", weight_kg: 3, has_kitchen: false,
    discount_rate: 0.10, popularity: 76, image_url: "water_purifier",
    created_at: new Date(), updated_at: new Date()
  },
  // Outdoor Gear
  {
    product_id: 13, category_id: 4, name: "All-Terrain Camping Chair Set",
    model: "ATCS-4", serial_number: "ATCS-4-001",
    description: "Set of 4 heavy-duty folding chairs with cup holders and side pockets. Supports up to 150kg each.",
    quantity_in_stocks: 20, base_price: 240, current_price: 199,
    warranty_status: "1 year", distributor_info: "OutdoorLife",
    berth_count: 0, fuel_type: "N/A", weight_kg: 10, has_kitchen: false,
    discount_rate: 0.17, popularity: 89, image_url: "camping_chairs",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 14, category_id: 4, name: "LED Camping Lantern Pack",
    model: "LCL-3", serial_number: "LCL-3-001",
    description: "Pack of 3 rechargeable LED lanterns with adjustable brightness. Waterproof and shockproof for outdoor use.",
    quantity_in_stocks: 40, base_price: 89, current_price: 69,
    warranty_status: "6 months", distributor_info: "OutdoorLife",
    berth_count: 0, fuel_type: "Rechargeable", weight_kg: 1.5, has_kitchen: false,
    discount_rate: 0.22, popularity: 96, image_url: "led_lanterns",
    created_at: new Date(), updated_at: new Date()
  },
  {
    product_id: 15, category_id: 4, name: "Adventure Sleeping Bag -20°C",
    model: "ASB-20", serial_number: "ASB-20-001",
    description: "Professional-grade sleeping bag rated to -20°C. Lightweight down insulation with compression sack.",
    quantity_in_stocks: 12, base_price: 199, current_price: 179,
    warranty_status: "1 year", distributor_info: "OutdoorLife",
    berth_count: 0, fuel_type: "N/A", weight_kg: 1.8, has_kitchen: false,
    discount_rate: 0.10, popularity: 84, image_url: "sleeping_bag",
    created_at: new Date(), updated_at: new Date()
  },
];

const users = [];
const orders = [];
const orderItems = [];
let nextUserId = 1;
let nextOrderId = 1;

// ── Mock Pool ──────────────────────────────────────────────

/**
 * Simulates pg pool.query() for the most common queries used in this app.
 * Pattern-matches the SQL string to determine which operation to perform.
 */
const mockPool = {
  query: async (sql, params = []) => {
    const s = sql.replace(/\s+/g, " ").trim().toUpperCase();

    // ─── SELECT NOW() (test connection) ───
    if (s.includes("SELECT NOW()")) {
      return { rows: [{ current_time: new Date() }] };
    }

    // ─── USERS ────────────────────────────
    if (s.includes("FROM USERS") && s.includes("WHERE EMAIL")) {
      const email = params[0];
      const user = users.find((u) => u.email === email);
      return { rows: user ? [user] : [] };
    }

    if (s.includes("FROM USERS") && s.includes("WHERE USER_ID")) {
      const id = params[0];
      const user = users.find((u) => u.user_id === id);
      return { rows: user ? [user] : [] };
    }

    if (s.includes("INSERT INTO USERS")) {
      const [name, email, password, tax_id, home_address, role] = params;
      const newUser = {
        user_id: nextUserId++,
        name, email, password, tax_id, home_address,
        role: role || "customer",
      };
      users.push(newUser);
      return { rows: [{ user_id: newUser.user_id, name, email, role: newUser.role }] };
    }

    // ─── PRODUCTS ─────────────────────────
    if (s.includes("FROM PRODUCTS") && s.includes("WHERE PRODUCT_ID")) {
      const id = Number(params[0]);
      const p = products.find((pr) => pr.product_id === id);
      return { rows: p ? [p] : [] };
    }

    if (s.includes("FROM PRODUCTS") && s.includes("WHERE CATEGORY_ID")) {
      const catId = Number(params[0]);
      const filtered = products.filter((p) => p.category_id === catId);
      return { rows: filtered };
    }

    if (s.includes("FROM PRODUCTS") && s.includes("ILIKE")) {
      const searchTerm = params[0];
      const regex = new RegExp(searchTerm.replace(/%/g, ".*"), "i");
      const filtered = products.filter(
        (p) => regex.test(p.name) || regex.test(p.description)
      );
      return { rows: filtered };
    }

    if (s.includes("UPDATE PRODUCTS") && s.includes("QUANTITY_IN_STOCKS")) {
      const [qty, id] = params;
      const p = products.find((pr) => pr.product_id === Number(id));
      if (p) {
        p.quantity_in_stocks -= Number(qty);
        if (p.quantity_in_stocks < 0) p.quantity_in_stocks = 0;
      }
      return { rows: p ? [p] : [] };
    }

    if (s.includes("FROM PRODUCTS") && !s.includes("WHERE")) {
      // Sort handling
      let sorted = [...products];
      if (s.includes("ORDER BY CURRENT_PRICE ASC")) {
        sorted.sort((a, b) => a.current_price - b.current_price);
      } else if (s.includes("ORDER BY CURRENT_PRICE DESC")) {
        sorted.sort((a, b) => b.current_price - a.current_price);
      } else if (s.includes("ORDER BY POPULARITY DESC")) {
        sorted.sort((a, b) => b.popularity - a.popularity);
      } else {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      return { rows: sorted };
    }

    // ─── ORDERS ───────────────────────────
    if (s.includes("INSERT INTO ORDERS")) {
      const [user_id, total_amount, shipping_address, status] = params;
      const newOrder = {
        order_id: nextOrderId++,
        user_id, total_amount, shipping_address,
        status: status || "processing",
        transaction_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      orders.push(newOrder);
      return { rows: [newOrder] };
    }

    if (s.includes("INSERT INTO ORDER_ITEMS")) {
      const [order_id, product_id, quantity, unit_price] = params;
      const item = { order_id, product_id, quantity, unit_price };
      orderItems.push(item);
      return { rows: [item] };
    }

    if (s.includes("FROM ORDERS") && s.includes("WHERE ORDER_ID")) {
      const id = Number(params[0]);
      const order = orders.find((o) => o.order_id === id);
      return { rows: order ? [order] : [] };
    }

    if (s.includes("FROM ORDERS") && s.includes("WHERE USER_ID")) {
      const userId = Number(params[0]);
      const userOrders = orders.filter((o) => o.user_id === userId);
      userOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: userOrders };
    }

    if (s.includes("UPDATE ORDERS") && s.includes("STATUS")) {
      const [status, transaction_id, order_id] = params;
      const order = orders.find((o) => o.order_id === Number(order_id));
      if (order) {
        order.status = status;
        if (transaction_id) order.transaction_id = transaction_id;
        order.updated_at = new Date();
      }
      return { rows: order ? [order] : [] };
    }

    if (s.includes("FROM ORDER_ITEMS") && s.includes("WHERE OI.ORDER_ID")) {
      const orderId = Number(params[0]);
      const items = orderItems
        .filter((oi) => oi.order_id === orderId)
        .map((oi) => {
          const product = products.find((p) => p.product_id === oi.product_id);
          return { ...oi, name: product?.name, image_url: product?.image_url };
        });
      return { rows: items };
    }

    // ─── CATEGORIES ───────────────────────
    if (s.includes("FROM CATEGORIES")) {
      return { rows: categories };
    }

    // Fallback
    console.warn("[MockDB] Unmatched query:", sql.substring(0, 100));
    return { rows: [] };
  },

  end: async () => {
    console.log("[MockDB] Connection pool ended.");
  },
};

module.exports = mockPool;
