export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  allergens: string[];
  spice_level: number;
  pairs_with: string[];
  available: boolean;
}

export interface Category {
  name: string;
  items: MenuItem[];
}

export interface DailySpecial {
  item_id: string;
  discount_percent: number;
  note: string;
}

export interface Combo {
  name: string;
  description: string;
  items: string[];
  combo_price: number;
  savings: number;
}

export interface Menu {
  restaurant: string;
  categories: Category[];
  daily_specials: DailySpecial[];
  combos: Combo[];
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  whatsapp_number: string;
  currency: string;
  currency_symbol: string;
  theme: {
    primary_color: string;
    secondary_color: string;
    font: string;
  };
  agent_personality: string;
  operating_hours: string;
  order_minimum: number;
}
