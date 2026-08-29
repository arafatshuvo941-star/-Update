import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory } from '../types';
import { formatTaka } from '../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Check,
  Tag,
  DollarSign,
  Layers,
  ArrowDownUp,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: ProductCategory[] = [
  'Gas Cylinder',
  'Mobile Load',
  'Medicine',
  'Grocery',
  'Beverages',
  'Snacks',
  'Stationery',
  'Personal Care',
  'General Retail',
  'Other',
];

const UNITS = ['pcs', 'kg', 'gm', 'litre', 'bottle', 'strip', 'box', 'pkt', 'cyl', 'tk', 'can'];

interface CatalogPreset {
  name: string;
  category: ProductCategory;
  unit: string;
  defaultPurchasePrice?: number;
  defaultSalePrice?: number;
  minStock?: number;
  extraInfo?: string;
  keywords?: string[];
}

const GLOBAL_CATALOG_PRESETS: CatalogPreset[] = [
  // Medicine
  {
    name: 'Maxpro 20mg Capsule (ম্যাক্সপ্রো ২০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 65,
    defaultSalePrice: 80,
    minStock: 10,
    extraInfo: 'Square Pharma (Esomeprazole 20mg)',
    keywords: ['maxpro', 'max', 'ম্যাক্সপ্রো', 'ম্যাক্স', 'square', 'esomeprazole', 'গ্যাস্ট্রিক'],
  },
  {
    name: 'Maxpro 40mg Capsule (ম্যাক্সপ্রো ৪০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 100,
    defaultSalePrice: 120,
    minStock: 5,
    extraInfo: 'Square Pharma (Esomeprazole 40mg)',
    keywords: ['maxpro', 'max40', 'ম্যাক্সপ্রো', 'ম্যাক্স ৪০', 'square'],
  },
  {
    name: 'Napa Extra Tablet (নাপা এক্সট্রা)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 22,
    defaultSalePrice: 27,
    minStock: 20,
    extraInfo: 'Beximco Pharma (Paracetamol 500mg + Caffeine 65mg)',
    keywords: ['napa', 'extra', 'নাপা', 'এক্সট্রা', 'beximco', 'জ্বর', 'ব্যথা'],
  },
  {
    name: 'Napa 500mg Tablet (নাপা ৫০০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 10,
    defaultSalePrice: 12,
    minStock: 20,
    extraInfo: 'Beximco Pharma (Paracetamol 500mg)',
    keywords: ['napa', 'নাপা', 'beximco', 'paracetamol'],
  },
  {
    name: 'Napa Extend Tablet (নাপা এক্সটেন্ড)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 18,
    defaultSalePrice: 22,
    minStock: 10,
    extraInfo: 'Beximco Pharma (Paracetamol 665mg)',
    keywords: ['napa extend', 'নাপা এক্সটেন্ড'],
  },
  {
    name: 'Ace Plus Tablet (এস প্লাস)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 22,
    defaultSalePrice: 27,
    minStock: 15,
    extraInfo: 'Square Pharma (Paracetamol + Caffeine)',
    keywords: ['ace', 'ace plus', 'এস প্লাস', 'square'],
  },
  {
    name: 'Ace 500mg Tablet (এস ৫০০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 10,
    defaultSalePrice: 12,
    minStock: 15,
    extraInfo: 'Square Pharma (Paracetamol 500mg)',
    keywords: ['ace', 'এস ৫০০', 'square'],
  },
  {
    name: 'Seclo 20mg Capsule (সেকলো ২০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 50,
    defaultSalePrice: 60,
    minStock: 10,
    extraInfo: 'Square Pharma (Omeprazole 20mg)',
    keywords: ['seclo', 'সেকলো', 'omeprazole', 'square'],
  },
  {
    name: 'Sergel 20mg Capsule (সারজেল ২০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 65,
    defaultSalePrice: 80,
    minStock: 10,
    extraInfo: 'Healthcare Pharma (Esomeprazole 20mg)',
    keywords: ['sergel', 'সারজেল', 'healthcare'],
  },
  {
    name: 'Losectil 20mg Capsule (লোসেকটিল ২০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 52,
    defaultSalePrice: 60,
    minStock: 10,
    extraInfo: 'SK+F (Omeprazole 20mg)',
    keywords: ['losectil', 'লোসেকটিল', 'skf'],
  },
  {
    name: 'Pantonix 20mg Tablet (প্যান্টোনিক্স ২০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 65,
    defaultSalePrice: 80,
    minStock: 10,
    extraInfo: 'Incepta Pharma (Pantoprazole 20mg)',
    keywords: ['pantonix', 'প্যান্টোনিক্স', 'incepta'],
  },
  {
    name: 'Monas 10mg Tablet (মোনাস ১০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 145,
    defaultSalePrice: 175,
    minStock: 5,
    extraInfo: 'Acme Pharma (Montelukast 10mg)',
    keywords: ['monas', 'মোনাস', 'acme', 'হাঁপানি', 'এলার্জি'],
  },
  {
    name: 'Ceevit 250mg Chewable (সিভিট ২৫০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 20,
    defaultSalePrice: 25,
    minStock: 15,
    extraInfo: 'Square Pharma (Vitamin C 250mg)',
    keywords: ['ceevit', 'সিভিট', 'vitamin c', 'square'],
  },
  {
    name: 'Fexo 120mg Tablet (ফেক্সো ১২০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 75,
    defaultSalePrice: 90,
    minStock: 8,
    extraInfo: 'Square Pharma (Fexofenadine 120mg)',
    keywords: ['fexo', 'ফেক্সো', 'square', 'allergy'],
  },
  {
    name: 'Alatrol 10mg Tablet (অ্যালাট্রল ১০)',
    category: 'Medicine',
    unit: 'strip',
    defaultPurchasePrice: 30,
    defaultSalePrice: 38,
    minStock: 10,
    extraInfo: 'Square Pharma (Cetirizine 10mg)',
    keywords: ['alatrol', 'অ্যালাট্রল', 'cetirizine', 'square'],
  },
  {
    name: 'ORSaline-N (ওরস্যালাইন-এন)',
    category: 'Medicine',
    unit: 'pkt',
    defaultPurchasePrice: 5.5,
    defaultSalePrice: 7,
    minStock: 30,
    extraInfo: 'SMC Oral Rehydration Salts',
    keywords: ['orsaline', 'saline', 'ওরস্যালাইন', 'স্যালাইন', 'smc'],
  },
  {
    name: 'Savlon Antiseptic Liquid 100ml (স্যাভলন)',
    category: 'Medicine',
    unit: 'bottle',
    defaultPurchasePrice: 50,
    defaultSalePrice: 60,
    minStock: 5,
    extraInfo: 'ACI Limited',
    keywords: ['savlon', 'স্যাভলন', 'aci', 'antiseptic'],
  },

  // Gas Cylinder
  {
    name: 'এলপি গ্যাস ১২কেজি (LP Gas 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1350,
    defaultSalePrice: 1450,
    minStock: 3,
    extraInfo: 'স্ট্যান্ডার্ড ১২ কেজি রিফিল',
    keywords: ['gas', 'গ্যাস', 'lp gas', 'এলপি গ্যাস', '12kg', '১২কেজি'],
  },
  {
    name: 'বেক্সিমকো এলপি গ্যাস ১২কেজি (Beximco LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1360,
    defaultSalePrice: 1460,
    minStock: 3,
    extraInfo: 'Beximco Smart LPG 12kg',
    keywords: ['beximco', 'বেক্সিমকো', 'gas', 'গ্যাস', '12kg'],
  },
  {
    name: 'বসুন্ধরা এলপি গ্যাস ১২কেজি (Bashundhara LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1360,
    defaultSalePrice: 1460,
    minStock: 3,
    extraInfo: 'Bashundhara LP Gas 12kg Refill',
    keywords: ['bashundhara', 'বসুন্ধরা', 'gas', 'গ্যাস', '12kg'],
  },
  {
    name: 'যমুনা এলপি গ্যাস ১২কেজি (Jamuna LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1350,
    defaultSalePrice: 1450,
    minStock: 3,
    extraInfo: 'Jamuna Gas 12kg',
    keywords: ['jamuna', 'যমুনা', 'gas', 'গ্যাস', '12kg'],
  },
  {
    name: 'ওমেরা এলপি গ্যাস ১২কেজি (Omera LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1350,
    defaultSalePrice: 1450,
    minStock: 3,
    extraInfo: 'Omera Petroleum 12kg',
    keywords: ['omera', 'ওমেরা', 'gas', 'গ্যাস', '12kg'],
  },
  {
    name: 'টোটাল এলপি গ্যাস ১২কেজি (Total LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1360,
    defaultSalePrice: 1460,
    minStock: 3,
    extraInfo: 'Total Gas 12kg',
    keywords: ['total', 'টোটাল', 'gas', 'গ্যাস'],
  },
  {
    name: 'বিএম এলপি গ্যাস ১২কেজি (BM LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1350,
    defaultSalePrice: 1450,
    minStock: 3,
    extraInfo: 'BM Energy 12kg',
    keywords: ['bm', 'বিএম', 'gas', 'গ্যাস'],
  },
  {
    name: 'ফ্রেশ এলপি গ্যাস ১২কেজি (Fresh LPG 12kg)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 1350,
    defaultSalePrice: 1450,
    minStock: 3,
    extraInfo: 'Meghna Group Fresh LP Gas 12kg',
    keywords: ['fresh gas', 'ফ্রেশ গ্যাস', 'gas'],
  },
  {
    name: 'খালি সিলিন্ডার ডিপোজিট (Empty Cylinder)',
    category: 'Gas Cylinder',
    unit: 'cyl',
    defaultPurchasePrice: 2000,
    defaultSalePrice: 2200,
    minStock: 2,
    extraInfo: 'নতুন খালি সিলিন্ডার ডিপোজিট',
    keywords: ['empty', 'খালি', 'deposit', 'সিলিন্ডার'],
  },
  {
    name: 'গ্যাস রেগুলেটর হাই-কোয়ালিটি (Gas Regulator)',
    category: 'Gas Cylinder',
    unit: 'pcs',
    defaultPurchasePrice: 220,
    defaultSalePrice: 300,
    minStock: 5,
    extraInfo: 'LPG Regulator with Safety Lock',
    keywords: ['regulator', 'রেগুলেটর', 'চুলা'],
  },

  // Mobile Load
  {
    name: 'জিপি ফ্লেক্সিলোড ব্যালেন্স (GP Flexiload)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 500,
    extraInfo: 'Grameenphone Balance (হাজারে ২৮ টাকা কমিশন)',
    keywords: ['gp', 'flexiload', 'জিপি', 'ফ্লেক্সিলোড', 'grameenphone', 'load', 'লোড'],
  },
  {
    name: 'বাংলালিংক ব্যালেন্স লোড (Banglalink Load)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 500,
    extraInfo: 'Banglalink Top-up (হাজারে ২৮ টাকা কমিশন)',
    keywords: ['banglalink', 'বাংলালিংক', 'bl', 'load', 'লোড'],
  },
  {
    name: 'রবি রিচার্জ ব্যালেন্স (Robi Recharge)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 500,
    extraInfo: 'Robi EasyLoad (হাজারে ২৮ টাকা কমিশন)',
    keywords: ['robi', 'রবি', 'load', 'recharge', 'লোড'],
  },
  {
    name: 'এয়ারটেল রিচার্জ ব্যালেন্স (Airtel Recharge)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 500,
    extraInfo: 'Airtel Balance Load',
    keywords: ['airtel', 'এয়ারটেল', 'load'],
  },
  {
    name: 'টেলিটক ব্যালেন্স লোড (Teletalk Load)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 300,
    extraInfo: 'Teletalk Recharge',
    keywords: ['teletalk', 'টেলিটক', 'load'],
  },
  {
    name: 'বিকাশ ক্যাশ আউট (bKash Cashout)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 1000,
    extraInfo: 'bKash Agent Cashout / Send Money',
    keywords: ['bkash', 'বিকাশ', 'cashout', 'send money'],
  },
  {
    name: 'নগদ ক্যাশ আউট (Nagad Cashout)',
    category: 'Mobile Load',
    unit: 'tk',
    defaultPurchasePrice: 1,
    defaultSalePrice: 1,
    minStock: 1000,
    extraInfo: 'Nagad Uddokta Service',
    keywords: ['nagad', 'নগদ', 'cashout'],
  },

  // Grocery
  {
    name: 'মিনিকেট চাল ২৫কেজি বস্তা (Miniket Rice 25kg)',
    category: 'Grocery',
    unit: 'bag',
    defaultPurchasePrice: 1750,
    defaultSalePrice: 1880,
    minStock: 5,
    extraInfo: 'কুষ্টিয়া অটো রাইস মিল প্রিমিয়াম মিনিকেট',
    keywords: ['miniket', 'rice', 'মিনিকেট', 'চাল', 'ভাত', 'বস্তা'],
  },
  {
    name: 'নাজিরশাইল চাল ২৫কেজি (Nazirshail Rice 25kg)',
    category: 'Grocery',
    unit: 'bag',
    defaultPurchasePrice: 1850,
    defaultSalePrice: 1980,
    minStock: 4,
    extraInfo: 'প্রিমিয়াম নাজিরশাইল চাল',
    keywords: ['nazirshail', 'নাজিরশাইল', 'rice', 'চাল'],
  },
  {
    name: 'তীর সয়াবিন তেল ৫লিটার (Teer Soyabean Oil 5L)',
    category: 'Grocery',
    unit: 'bottle',
    defaultPurchasePrice: 880,
    defaultSalePrice: 940,
    minStock: 4,
    extraInfo: 'City Group Fortified Vitamin A',
    keywords: ['teer', 'oil', 'তীর', 'তেল', 'সয়াবিন', '5l', '৫লিটার'],
  },
  {
    name: 'রূপচাঁদা সয়াবিন তেল ১লিটার (Rupchanda Oil 1L)',
    category: 'Grocery',
    unit: 'bottle',
    defaultPurchasePrice: 175,
    defaultSalePrice: 190,
    minStock: 6,
    extraInfo: 'Bangladesh Edible Oil Limited',
    keywords: ['rupchanda', 'রূপচাঁদা', 'oil', 'তেল', '1l'],
  },
  {
    name: 'ফ্রেশ চিনি ১কেজি (Fresh Sugar 1kg)',
    category: 'Grocery',
    unit: 'pkt',
    defaultPurchasePrice: 135,
    defaultSalePrice: 145,
    minStock: 10,
    extraInfo: 'Fresh Refined White Sugar',
    keywords: ['sugar', 'চিনি', 'fresh', 'ফ্রেশ'],
  },
  {
    name: 'এসিআই লবণ ১কেজি (ACI Pure Salt 1kg)',
    category: 'Grocery',
    unit: 'pkt',
    defaultPurchasePrice: 35,
    defaultSalePrice: 42,
    minStock: 15,
    extraInfo: 'ACI Vacuum Evaporated Pure Salt',
    keywords: ['aci', 'salt', 'লবণ', 'এসিআই'],
  },
  {
    name: 'তীর আটা ২কেজি (Teer Atta 2kg)',
    category: 'Grocery',
    unit: 'pkt',
    defaultPurchasePrice: 110,
    defaultSalePrice: 125,
    minStock: 8,
    extraInfo: 'Teer Whole Wheat Flour',
    keywords: ['atta', 'আটা', 'teer', 'তীর', 'রুটি'],
  },
  {
    name: 'তীর ময়দা ২কেজি (Teer Maida 2kg)',
    category: 'Grocery',
    unit: 'pkt',
    defaultPurchasePrice: 130,
    defaultSalePrice: 148,
    minStock: 6,
    extraInfo: 'Teer Premium Maida',
    keywords: ['maida', 'ময়দা', 'teer'],
  },
  {
    name: 'মসুর ডাল ১কেজি (Masoor Dal 1kg)',
    category: 'Grocery',
    unit: 'kg',
    defaultPurchasePrice: 130,
    defaultSalePrice: 145,
    minStock: 10,
    extraInfo: 'চিকন মসুর ডাল',
    keywords: ['dal', 'ডাল', 'মসুর', 'lentil'],
  },

  // Beverages
  {
    name: 'কোকাকোলা ৫০০মিলি (Coca-Cola 500ml)',
    category: 'Beverages',
    unit: 'bottle',
    defaultPurchasePrice: 38,
    defaultSalePrice: 45,
    minStock: 12,
    extraInfo: 'Coca-Cola Pet Bottle',
    keywords: ['coca cola', 'coke', 'কোকাকোলা', 'কোক', 'cold drinks'],
  },
  {
    name: 'স্প্রাইট ৫০০মিলি (Sprite 500ml)',
    category: 'Beverages',
    unit: 'bottle',
    defaultPurchasePrice: 38,
    defaultSalePrice: 45,
    minStock: 12,
    extraInfo: 'Sprite Pet Bottle',
    keywords: ['sprite', 'স্প্রাইট', 'cold drinks'],
  },
  {
    name: 'মোজো ২৫০মিলি (Mojo 250ml)',
    category: 'Beverages',
    unit: 'bottle',
    defaultPurchasePrice: 17,
    defaultSalePrice: 20,
    minStock: 15,
    extraInfo: 'Akij Food & Beverage',
    keywords: ['mojo', 'মোজো', 'cola'],
  },
  {
    name: 'প্রাণ ফ্রুটো ২৫০মিলি (Pran Frooto)',
    category: 'Beverages',
    unit: 'bottle',
    defaultPurchasePrice: 20,
    defaultSalePrice: 25,
    minStock: 10,
    extraInfo: 'Pran Mango Juice',
    keywords: ['frooto', 'ফ্রুটো', 'juice', 'আম'],
  },
  {
    name: 'কিনলে পানি ৫০০মিলি (Kinley Water 500ml)',
    category: 'Beverages',
    unit: 'bottle',
    defaultPurchasePrice: 12,
    defaultSalePrice: 15,
    minStock: 20,
    extraInfo: 'Kinley Drinking Water',
    keywords: ['kinley', 'পানি', 'water', 'কিনলে'],
  },
  {
    name: 'মাম পানি ১লিটার (Mum Water 1L)',
    category: 'Beverages',
    unit: 'bottle',
    defaultPurchasePrice: 18,
    defaultSalePrice: 25,
    minStock: 15,
    extraInfo: 'Partex Mum Mineral Water',
    keywords: ['mum', 'মাম', 'water', 'পানি'],
  },

  // Snacks
  {
    name: 'প্রাণ পটেটো ক্র্যাকার্স (Potato Crackers)',
    category: 'Snacks',
    unit: 'pkt',
    defaultPurchasePrice: 12,
    defaultSalePrice: 15,
    minStock: 15,
    extraInfo: 'Pran Potato Chips 25g',
    keywords: ['potato', 'crackers', 'পটেটো', 'চিপস', 'chips'],
  },
  {
    name: 'লেক্সাস ভেজিটেবল বিস্কুট (Lexus Biscuit)',
    category: 'Snacks',
    unit: 'pkt',
    defaultPurchasePrice: 42,
    defaultSalePrice: 50,
    minStock: 10,
    extraInfo: 'Lexus Vegetable Crackers',
    keywords: ['lexus', 'লেক্সাস', 'biscuit', 'বিস্কুট'],
  },
  {
    name: 'বম্বে সুইটস চানাচুর ১৫০গ্রাম (Chanachur)',
    category: 'Snacks',
    unit: 'pkt',
    defaultPurchasePrice: 38,
    defaultSalePrice: 45,
    minStock: 10,
    extraInfo: 'Bombay Sweets Special Chanachur',
    keywords: ['chanachur', 'চানাচুর', 'bombay sweets'],
  },
  {
    name: 'অলিম্পিক এনার্জি প্লাস বিস্কুট (Energy Plus)',
    category: 'Snacks',
    unit: 'pkt',
    defaultPurchasePrice: 28,
    defaultSalePrice: 35,
    minStock: 12,
    extraInfo: 'Olympic Energy Plus',
    keywords: ['energy', 'olympic', 'বিস্কুট', 'এনার্জি'],
  },
  {
    name: 'ডেরি মিল্ক চকলেট (Cadbury Dairy Milk)',
    category: 'Snacks',
    unit: 'pcs',
    defaultPurchasePrice: 40,
    defaultSalePrice: 50,
    minStock: 10,
    extraInfo: 'Cadbury Dairy Milk Chocolate',
    keywords: ['dairy milk', 'চকলেট', 'chocolate', 'cadbury'],
  },

  // Stationery
  {
    name: 'ম্যাটাডোর অল-টাইম বলপেন (Matador Pen)',
    category: 'Stationery',
    unit: 'pcs',
    defaultPurchasePrice: 4.5,
    defaultSalePrice: 6,
    minStock: 30,
    extraInfo: 'Matador All-Time Ballpoint Pen',
    keywords: ['matador', 'pen', 'কলম', 'ম্যাটাডোর'],
  },
  {
    name: 'ম্যাটাডোর পিন-পয়েন্ট পেন (Pinpoint Pen)',
    category: 'Stationery',
    unit: 'pcs',
    defaultPurchasePrice: 6.5,
    defaultSalePrice: 8,
    minStock: 25,
    extraInfo: 'Matador Pinpoint 0.6mm Pen',
    keywords: ['pinpoint', 'পিনপয়েন্ট', 'matador', 'pen'],
  },
  {
    name: 'এ৪ সাইজ খাতা ১২০ পৃষ্ঠা (A4 Exercise Book)',
    category: 'Stationery',
    unit: 'pcs',
    defaultPurchasePrice: 45,
    defaultSalePrice: 60,
    minStock: 10,
    extraInfo: 'A4 Bound Ruled Note Book',
    keywords: ['khata', 'book', 'খাতা', 'a4', 'note'],
  },
  {
    name: 'এ৪ ফটোকপি পেপার রিম (Paper Ream 500)',
    category: 'Stationery',
    unit: 'box',
    defaultPurchasePrice: 440,
    defaultSalePrice: 490,
    minStock: 4,
    extraInfo: 'Paperline / Double A 80GSM A4 500 Sheets',
    keywords: ['paper', 'কাগজ', 'a4', 'photocopy', 'রিম'],
  },

  // Personal Care
  {
    name: 'লাক্স সাবান ১০০গ্রাম (Lux Soap)',
    category: 'Personal Care',
    unit: 'pcs',
    defaultPurchasePrice: 58,
    defaultSalePrice: 68,
    minStock: 10,
    extraInfo: 'Unilever Lux Beauty Soap',
    keywords: ['lux', 'লাক্স', 'soap', 'সাবান'],
  },
  {
    name: 'লাইফবয় সাবান ১০০গ্রাম (Lifebuoy Soap)',
    category: 'Personal Care',
    unit: 'pcs',
    defaultPurchasePrice: 50,
    defaultSalePrice: 60,
    minStock: 10,
    extraInfo: 'Unilever Lifebuoy Total 10',
    keywords: ['lifebuoy', 'লাইফবয়', 'soap', 'সাবান'],
  },
  {
    name: 'সানসিল্ক শ্যাম্পু ১৮০মিলি (Sunsilk 180ml)',
    category: 'Personal Care',
    unit: 'bottle',
    defaultPurchasePrice: 185,
    defaultSalePrice: 210,
    minStock: 5,
    extraInfo: 'Sunsilk Black Shine Shampoo',
    keywords: ['sunsilk', 'সানসিল্ক', 'shampoo', 'শ্যাম্পু'],
  },
  {
    name: 'ক্লোজআপ টুথপেস্ট ১০০গ্রাম (Closeup Paste)',
    category: 'Personal Care',
    unit: 'pcs',
    defaultPurchasePrice: 85,
    defaultSalePrice: 100,
    minStock: 8,
    extraInfo: 'Closeup Red Hot Gel Toothpaste',
    keywords: ['closeup', 'ক্লোজআপ', 'toothpaste', 'টুথপেস্ট'],
  },

  // General Retail
  {
    name: 'ফাস্ট মোবাইল চার্জার ২০ ওয়াট (Mobile Charger)',
    category: 'General Retail',
    unit: 'pcs',
    defaultPurchasePrice: 180,
    defaultSalePrice: 280,
    minStock: 5,
    extraInfo: '20W QC / PD Fast Charger Adapter',
    keywords: ['charger', 'চার্জার', 'mobile', 'adapter'],
  },
  {
    name: 'টাইপ-সি ফাস্ট ক্যাবল (Type-C USB Cable)',
    category: 'General Retail',
    unit: 'pcs',
    defaultPurchasePrice: 60,
    defaultSalePrice: 120,
    minStock: 8,
    extraInfo: 'Braided Fast Charging Type-C Cable',
    keywords: ['cable', 'ক্যাবল', 'type c', 'usb'],
  },
  {
    name: 'মাল্টিপ্লাগ ৪ পোর্ট ৩ মিটার (Multiplug 4 Port)',
    category: 'General Retail',
    unit: 'pcs',
    defaultPurchasePrice: 160,
    defaultSalePrice: 240,
    minStock: 4,
    extraInfo: '4 Port Extension Socket with Switch',
    keywords: ['multiplug', 'মাল্টিপ্লাগ', 'socket', 'plug'],
  },
  {
    name: 'এলইডি বাল্ব ১২ ওয়াট (LED Bulb 12W)',
    category: 'General Retail',
    unit: 'pcs',
    defaultPurchasePrice: 120,
    defaultSalePrice: 170,
    minStock: 10,
    extraInfo: '12W Bright White Pin/Screw LED Bulb',
    keywords: ['bulb', 'বাল্ব', 'light', 'led', 'বাতি'],
  },
];

const CATEGORY_DEFAULTS: Record<
  ProductCategory,
  { defaultName: string; defaultUnit: string; suggestions: string[] }
> = {
  'Gas Cylinder': {
    defaultName: 'এলপি গ্যাস ১২কেজি (LP Gas 12kg)',
    defaultUnit: 'cyl',
    suggestions: [
      'এলপি গ্যাস ১২কেজি (LP Gas 12kg)',
      'বেক্সিমকো এলপি গ্যাস ১২কেজি (Beximco LPG 12kg)',
      'বসুন্ধরা এলপি গ্যাস ১২কেজি (Bashundhara LPG 12kg)',
      'যমুনা এলপি গ্যাস ১২কেজি (Jamuna LPG 12kg)',
      'ওমেরা এলপি গ্যাস ১২কেজি (Omera LPG 12kg)',
      'টোটাল এলপি গ্যাস ১২কেজি (Total LPG 12kg)',
      'খালি সিলিন্ডার ডিপোজিট (Empty Cylinder)',
    ],
  },
  'Mobile Load': {
    defaultName: 'জিপি ফ্লেক্সিলোড ব্যালেন্স (GP Flexiload)',
    defaultUnit: 'tk',
    suggestions: [
      'জিপি ফ্লেক্সিলোড ব্যালেন্স (GP Flexiload)',
      'বাংলালিংক ব্যালেন্স লোড (Banglalink Load)',
      'রবি রিচার্জ ব্যালেন্স (Robi Recharge)',
      'এয়ারটেল রিচার্জ ব্যালেন্স (Airtel Recharge)',
      'টেলিটক ব্যালেন্স লোড (Teletalk Load)',
      'বিকাশ ক্যাশ আউট (bKash Cashout)',
      'নগদ ক্যাশ আউট (Nagad Cashout)',
    ],
  },
  'Medicine': {
    defaultName: 'নাপা এক্সট্রা ট্যাবলেট (Napa Extra)',
    defaultUnit: 'strip',
    suggestions: [
      'নাপা এক্সট্রা ট্যাবলেট (Napa Extra)',
      'ম্যাক্সপ্রো ২০মিগ্রা (Maxpro 20mg)',
      'ম্যাক্সপ্রো ৪০মিগ্রা (Maxpro 40mg)',
      'এস প্লাস ট্যাবলেট (Ace Plus)',
      'সেকলো ২০মিগ্রা (Seclo 20mg)',
      'সারজেল ২০মিগ্রা (Sergel 20mg)',
      'মোনাস ১০মিগ্রা (Monas 10mg)',
      'সিভিট ট্যাবলেট (Ceevit 250mg)',
    ],
  },
  'Grocery': {
    defaultName: 'মিনিকেট চাল ২৫কেজি বস্তা (Miniket Rice 25kg)',
    defaultUnit: 'bag',
    suggestions: [
      'মিনিকেট চাল ২৫কেজি বস্তা (Miniket Rice 25kg)',
      'নাজিরশাইল চাল ২৫কেজি (Nazirshail Rice 25kg)',
      'তীর সয়াবিন তেল ৫লিটার (Teer Soyabean Oil 5L)',
      'রূপচাঁদা সয়াবিন তেল ১লিটার (Rupchanda Oil 1L)',
      'ফ্রেশ চিনি ১কেজি (Fresh Sugar 1kg)',
      'এসিআই লবণ ১কেজি (ACI Pure Salt 1kg)',
      'তীর আটা ২কেজি (Teer Atta 2kg)',
      'মসুর ডাল ১কেজি (Masoor Dal 1kg)',
    ],
  },
  'Beverages': {
    defaultName: 'কোকাকোলা ৫০০মিলি (Coca-Cola 500ml)',
    defaultUnit: 'bottle',
    suggestions: [
      'কোকাকোলা ৫০০মিলি (Coca-Cola 500ml)',
      'স্প্রাইট ৫০০মিলি (Sprite 500ml)',
      'মোজো ২৫০মিলি (Mojo 250ml)',
      'প্রাণ ফ্রুটো ২৫০মিলি (Pran Frooto)',
      'কিনলে পানি ৫০০মিলি (Kinley Water 500ml)',
      'মাম পানি ১লিটার (Mum Water 1L)',
    ],
  },
  'Snacks': {
    defaultName: 'প্রাণ পটেটো ক্র্যাকার্স (Potato Crackers)',
    defaultUnit: 'pkt',
    suggestions: [
      'প্রাণ পটেটো ক্র্যাকার্স (Potato Crackers)',
      'লেক্সাস ভেজিটেবল বিস্কুট (Lexus Biscuit)',
      'বম্বে সুইটস চানাচুর ১৫০গ্রাম (Chanachur)',
      'অলিম্পিক এনার্জি প্লাস বিস্কুট (Energy Plus)',
      'ডেরি মিল্ক চকলেট (Cadbury Dairy Milk)',
    ],
  },
  'Stationery': {
    defaultName: 'ম্যাটাডোর অল-টাইম বলপেন (Matador Pen)',
    defaultUnit: 'pcs',
    suggestions: [
      'ম্যাটাডোর অল-টাইম বলপেন (Matador Pen)',
      'ম্যাটাডোর পিন-পয়েন্ট পেন (Pinpoint Pen)',
      'এ৪ সাইজ খাতা ১২০ পৃষ্ঠা (A4 Exercise Book)',
      'এ৪ ফটোকপি পেপার রিম (Paper Ream 500)',
    ],
  },
  'Personal Care': {
    defaultName: 'লাক্স সাবান ১০০গ্রাম (Lux Soap)',
    defaultUnit: 'pcs',
    suggestions: [
      'লাক্স সাবান ১০০গ্রাম (Lux Soap)',
      'লাইফবয় সাবান ১০০গ্রাম (Lifebuoy Soap)',
      'সানসিল্ক শ্যাম্পু ১৮০মিলি (Sunsilk 180ml)',
      'ক্লোজআপ টুথপেস্ট ১০০গ্রাম (Closeup Paste)',
    ],
  },
  'General Retail': {
    defaultName: 'ফাস্ট মোবাইল চার্জার ২০ ওয়াট (Mobile Charger)',
    defaultUnit: 'pcs',
    suggestions: [
      'ফাস্ট মোবাইল চার্জার ২০ ওয়াট (Mobile Charger)',
      'টাইপ-সি ফাস্ট ক্যাবল (Type-C USB Cable)',
      'মাল্টিপ্লাগ ৪ পোর্ট ৩ মিটার (Multiplug 4 Port)',
      'এলইডি বাল্ব ১২ ওয়াট (LED Bulb 12W)',
    ],
  },
  'Other': {
    defaultName: '',
    defaultUnit: 'pcs',
    suggestions: [],
  },
};

export const ProductsManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct, t, settings, updateSettings } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'in' | 'low' | 'out' | 'all'>('in');

  // Add/Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Name Search & Autocomplete State
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const dynamicCategories = useMemo(() => {
    const deletedCats = settings?.deletedCategories || [];
    const customCats = settings?.customCategories || [];
    const productCats = products.map((p) => p.category);
    const allCats = [...CATEGORIES, ...customCats, ...productCats].filter(
      (c) => c && !deletedCats.includes(c)
    );
    return Array.from(new Set(allCats)).sort();
  }, [products, settings?.customCategories, settings?.deletedCategories]);


  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory | string>('Grocery');
  const [unit, setUnit] = useState('pcs');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('5');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  // Quick Restock Modal
  const [restockItem, setRestockItem] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>('10');
  const [restockPrice, setRestockPrice] = useState<string>('');

  // Delete Confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Manage Categories Modal State
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newCatNameInput, setNewCatNameInput] = useState('');
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

  const handleDeleteCategory = (catToDelete: string) => {
    // 1. Remove from saved custom categories in store settings & add to deleted list
    const updatedCustomCats = (settings?.customCategories || []).filter((c) => c !== catToDelete);
    const updatedDeletedCats = Array.from(new Set([...(settings?.deletedCategories || []), catToDelete]));
    updateSettings({
      customCategories: updatedCustomCats,
      deletedCategories: updatedDeletedCats,
    });

    // 2. Reassign products in this category to an available fallback category
    const remaining = dynamicCategories.filter((c) => c !== catToDelete);
    const fallbackCategory = remaining[0] || 'General Retail';
    products.forEach((p) => {
      if (p.category === catToDelete) {
        updateProduct(p.id, { category: fallbackCategory });
      }
    });

    // 3. Reset form/filter category if currently selected
    if (selectedCategory === catToDelete) {
      setSelectedCategory('All');
    }
    if (category === catToDelete) {
      setCategory(fallbackCategory);
    }
    setConfirmDeleteCategory(null);
  };

  const handleRestoreDefaultCategories = () => {
    updateSettings({ deletedCategories: [] });
  };

  // Matched Catalog Presets & Existing Products for Name Autocomplete Search
  const catalogNameSuggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    
    // Combine presets and existing inventory names
    const allCandidates: CatalogPreset[] = [...GLOBAL_CATALOG_PRESETS];
    
    // Add unique existing product names that aren't already in presets
    products.forEach((p) => {
      if (!allCandidates.some((c) => c.name.toLowerCase() === p.name.toLowerCase())) {
        allCandidates.push({
          name: p.name,
          category: (p.category as ProductCategory) || 'Other',
          unit: p.unit,
          defaultPurchasePrice: p.purchasePrice,
          defaultSalePrice: p.salePrice,
          minStock: p.minStock,
          extraInfo: p.extraInfo,
          keywords: [p.name.toLowerCase(), (p.category || '').toLowerCase()],
        });
      }
    });

    if (!q) {
      // If query is empty, show items from the currently selected category first
      return allCandidates.filter((item) => item.category === category).slice(0, 10);
    }

    return allCandidates
      .filter((item) => {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesKeywords = item.keywords?.some((kw) => kw.toLowerCase().includes(q));
        const matchesExtra = item.extraInfo?.toLowerCase().includes(q);
        return matchesName || matchesCategory || matchesKeywords || matchesExtra;
      })
      .sort((a, b) => {
        // Prioritize items in current category
        const aCatMatch = a.category === category ? 1 : 0;
        const bCatMatch = b.category === category ? 1 : 0;
        if (aCatMatch !== bCatMatch) return bCatMatch - aCatMatch;

        // Prioritize startsWith name
        const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
        return bStarts - aStarts;
      })
      .slice(0, 8);
  }, [name, category, products]);

  const selectCatalogPreset = (preset: CatalogPreset) => {
    setName(preset.name);
    setIsCustomCategory(false);
    setCategory(preset.category);
    setUnit(preset.unit);
    if ((!purchasePrice || purchasePrice === '0') && preset.defaultPurchasePrice !== undefined) {
      setPurchasePrice(preset.defaultPurchasePrice.toString());
    }
    if ((!salePrice || salePrice === '0') && preset.defaultSalePrice !== undefined) {
      setSalePrice(preset.defaultSalePrice.toString());
    }
    if (preset.minStock !== undefined && (!minStock || minStock === '5')) {
      setMinStock(preset.minStock.toString());
    }
    if (preset.extraInfo && !extraInfo) {
      setExtraInfo(preset.extraInfo);
    }
    setIsNameDropdownOpen(false);
  };

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.extraInfo && p.extraInfo.toLowerCase().includes(q));

      let matchesStock = true;
      if (stockFilter === 'in') {
        matchesStock = p.currentStock > 0;
      } else if (stockFilter === 'low') {
        matchesStock = p.currentStock <= p.minStock && p.currentStock > 0;
      } else if (stockFilter === 'out') {
        matchesStock = p.currentStock <= 0;
      }

      return matchesCat && matchesSearch && matchesStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    const initCat: ProductCategory = 'Gas Cylinder';
    const config = CATEGORY_DEFAULTS[initCat];
    setName(config ? config.defaultName : '');
    setCategory(initCat);
    setUnit(config ? config.defaultUnit : 'pcs');
    setPurchasePrice('');
    setSalePrice('');
    setCurrentStock('');
    setMinStock('5');
    setExpiryDate('');
    setBarcode('');
    setExtraInfo('');
    setShowOptionalFields(false);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (newCat: ProductCategory) => {
    setCategory(newCat);
    const config = CATEGORY_DEFAULTS[newCat];
    if (config) {
      setUnit(config.defaultUnit);
      // Auto-update name if creating a new product and name is empty or matches a known template
      if (!editingProduct) {
        const isDefaultOrEmpty =
          !name.trim() ||
          Object.values(CATEGORY_DEFAULTS).some(
            (c) => c.defaultName === name || c.suggestions.includes(name)
          );
        if (isDefaultOrEmpty && config.defaultName) {
          setName(config.defaultName);
        }
      }
    }
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setIsCustomCategory(false);
    setName(prod.name);
    setCategory(prod.category);
    setUnit(prod.unit);
    setPurchasePrice(prod.purchasePrice.toString());
    setSalePrice(prod.salePrice.toString());
    setCurrentStock(prod.currentStock.toString());
    setMinStock(prod.minStock.toString());
    setExpiryDate(prod.expiryDate || '');
    setBarcode(prod.barcode || '');
    setExtraInfo(prod.extraInfo || '');
    setShowOptionalFields(!!(prod.expiryDate || prod.barcode || prod.extraInfo));
    setIsModalOpen(true);
  };

  
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category.trim() || 'Other';
    if (!CATEGORIES.includes(finalCategory as any) && !(settings?.customCategories || []).includes(finalCategory)) {
      updateSettings({ customCategories: [...(settings?.customCategories || []), finalCategory] });
    }
    const parsedPurchase = Math.max(0, Number(purchasePrice) || 0);
    const parsedSale = Math.max(0, Number(salePrice) || 0);
    const parsedStock = Math.max(0, Number(currentStock) || 0);
    const parsedMinStock = Math.max(0, Number(minStock) || 5);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        category: finalCategory,

        unit,
        purchasePrice: parsedPurchase,
        salePrice: parsedSale,
        currentStock: parsedStock,
        minStock: parsedMinStock,
        expiryDate: expiryDate.trim() || undefined,
        barcode: barcode.trim() || undefined,
        extraInfo: extraInfo.trim() || undefined,
      });
    } else {
      addProduct({
        name: name.trim(),
        category: finalCategory,
        unit,
        purchasePrice: parsedPurchase,
        salePrice: parsedSale,
        currentStock: parsedStock,
        minStock: parsedMinStock,
        expiryDate: expiryDate.trim() || undefined,
        barcode: barcode.trim() || undefined,
        extraInfo: extraInfo.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleApplyRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const added = Number(restockQty) || 0;
    const newPrice = restockPrice ? Number(restockPrice) : undefined;
    if (added > 0) {
      restockProduct(restockItem.id, added, newPrice);
    }
    setRestockItem(null);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>পণ্যের তালিকা ও স্টক (Products)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকানের সকল মালামাল, কেনা-বেচার দর ও মজুদ নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-load-balance-product"
            onClick={() => {
              setEditingProduct(null);
    setIsCustomCategory(false);
              setName('GP Flexiload Balance (গ্রামীণফোন ব্যালেন্স)');
              setCategory('Mobile Load');
              setUnit('tk');
              setPurchasePrice('97.2');
              setSalePrice('100');
              setCurrentStock('20000');
              setMinStock('1000');
              setExtraInfo('হাজারে ২৮ টাকা লাভ (২.৮% কমিশন)');
              setShowOptionalFields(false);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-sky-600" />
            <span>+ লোড ব্যালেন্স স্টক যোগ</span>
          </button>

          <button
            id="btn-add-product"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-search-products-list"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পণ্য, {t('category')} বা বিবরণ {t('search')}"
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category selector */}
        <div className="sm:col-span-3 flex gap-1.5">
          <select
            value={selectedCategory}
            onChange={(e) => {
              if (e.target.value === 'MANAGE_CATEGORIES') {
                setIsManageCategoriesOpen(true);
              } else {
                setSelectedCategory(e.target.value);
              }
            }}
            className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">সকল {t('category')} ({products.length})</option>
            {dynamicCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({products.filter((p) => p.category === cat).length})
              </option>
            ))}
            <option value="MANAGE_CATEGORIES" className="text-emerald-600 font-bold">
              ⚙️ ক্যাটাগরি ম্যানেজ / মুছুন...
            </option>
          </select>
          <button
            type="button"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-600 transition-colors"
            title="ক্যাটাগরি ম্যানেজ ও মুছুন"
          >
            <Tag className="w-4 h-4" />
          </button>
        </div>

        {/* Stock Filter Pills */}
        <div className="sm:col-span-3 flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-600">
          <button
            onClick={() => setStockFilter('in')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              stockFilter === 'in' ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            স্টকে আছে
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              stockFilter === 'low' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            কম স্টক
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              stockFilter === 'out' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            স্টক শেষ
          </button>
          <button
            onClick={() => setStockFilter('all')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              stockFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            সব
          </button>
        </div>
      </div>

      {/* Products Table & Responsive Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">{t('productName')} ও বিবরণ</th>
                <th className="py-3 px-3">{t('category')}</th>
                <th className="py-3 px-3 text-right">কেনা দাম</th>
                <th className="py-3 px-3 text-right">বিক্রি দাম</th>
                <th className="py-3 px-3 text-right">লাভ / একক</th>
                <th className="py-3 px-3 text-center">বর্তমান স্টক</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.currentStock <= 0;
                  const isLowStock = prod.currentStock <= prod.minStock;
                  const unitProfit = prod.salePrice - prod.purchasePrice;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{prod.id}</span>
                          {prod.extraInfo && <span>• {prod.extraInfo}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatTaka(prod.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatTaka(prod.salePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-teal-600 whitespace-nowrap">
                        +{formatTaka(unitProfit)}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                          {isLowStock && !isOutOfStock && (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Restock button */}
                          <button
                            onClick={() => {
                              setRestockItem(prod);
                              setRestockQty('10');
                              setRestockPrice(prod.purchasePrice.toString());
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-[11px] flex items-center gap-1"
                            title="মাল যোগ করুন (Restock)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">স্টক যোগ</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteConfirmId(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 my-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                {editingProduct ? 'পণ্য সংশোধন (Edit Product)' : 'নতুন পণ্য যোগ (Add Product)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              {/* Product Name (Search + Type Combobox) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    {t('productName')} (Search বা Type করুন) *
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    ⚡ সার্চ বা সরাসরি টাইপ
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="নাম লিখুন বা {t('search')}েমন: Maxpro, নাপা, মিনিকেট, গ্যাস...)"
                    value={name}
                    onFocus={() => setIsNameDropdownOpen(true)}
                    onChange={(e) => {
                      setName(e.target.value);
                      setIsNameDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsNameDropdownOpen(false);
                    }}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  {name && (
                    <button
                      type="button"
                      onClick={() => {
                        setName('');
                        setIsNameDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-full"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Auto-suggest Search Dropdown */}
                {isNameDropdownOpen && catalogNameSuggestions.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNameDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-500 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          পণ্য সাজেশন ({catalogNameSuggestions.length}টি পাওয়া গেছে)
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ক্লিক করলে তথ্য অটো-বসবে
                        </span>
                      </div>
                      {catalogNameSuggestions.map((item, idx) => (
                        <button
                          key={`${item.name}-${idx}`}
                          type="button"
                          onClick={() => selectCatalogPreset(item)}
                          className="w-full text-left px-3 py-2.5 hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 truncate">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium border border-slate-200 dark:border-slate-700">
                                {item.category}
                              </span>
                              <span className="text-slate-400 font-medium">একক: {item.unit}</span>
                              {item.extraInfo && (
                                <span className="text-slate-400 truncate max-w-[140px]">
                                  • {item.extraInfo}
                                </span>
                              )}
                            </div>
                          </div>
                          {item.defaultSalePrice !== undefined && (
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                ৳{item.defaultSalePrice}
                              </span>
                              {item.defaultPurchasePrice !== undefined && (
                                <div className="text-[9px] text-slate-400">
                                  ক্রয়: ৳{item.defaultPurchasePrice}
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                      {name.trim() && (
                        <div
                          onClick={() => setIsNameDropdownOpen(false)}
                          className="px-3 py-2 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-[11px] font-bold cursor-pointer text-center border-t border-emerald-100"
                        >
                          ✓ &quot;{name.trim()}&quot; নামেই নতুন পণ্য রাখুন
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Popular Name Suggestions for this Category */}
                {CATEGORY_DEFAULTS[category]?.suggestions.length > 0 && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        ⚡ ১-ক্লিকে নাম বসান (প্রয়োজনে এডিট করুন):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
                      {CATEGORY_DEFAULTS[category].suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setName(sug);
                            // Also check if matches any catalog item to auto-fill unit & prices
                            const matched = GLOBAL_CATALOG_PRESETS.find(
                              (p) => p.name.toLowerCase() === sug.toLowerCase()
                            );
                            if (matched) {
                              selectCatalogPreset(matched);
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left cursor-pointer ${
                            name === sug
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/60 font-medium'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-2.5">
                
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('category')} *</label>
                  {isCustomCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="নতুন ক্যাটাগরি লিখুন"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const finalCat = category.trim();
                          if (finalCat && !CATEGORIES.includes(finalCat as any) && !(settings?.customCategories || []).includes(finalCat)) {
                            updateSettings({ customCategories: [...(settings?.customCategories || []), finalCat] });
                          }
                          setIsCustomCategory(false);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl transition-colors"
                        title="Save Category"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory(dynamicCategories[0] || 'General Retail');
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsCustomCategory(true);
                          setCategory('');
                        } else {
                          handleCategoryChange(e.target.value as ProductCategory);
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {dynamicCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="ADD_NEW" className="font-bold text-emerald-600">+ নতুন ক্যাটাগরি তৈরি করুন</option>
                    </select>
                  )}
                </div>


                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">একক (Unit) *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Price & Sale Price */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    কেনা দাম (Purchase ৳) *
                  </label>
                  <input
                    type="number" step="any"
                    required
                    placeholder="0"
                    value={purchasePrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিক্রি দাম (Sale ৳) *
                  </label>
                  <input
                    type="number" step="any"
                    required
                    placeholder="0"
                    value={salePrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Stock & Min Stock Alert */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বর্তমান স্টক (Current Stock) *
                  </label>
                  <input
                    type="number" step="any"
                    required
                    placeholder="0"
                    value={currentStock}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('minStock')} (Min Stock)
                  </label>
                  <input
                    placeholder="5"
                    value={minStock}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Collapsible Optional Fields (Medicine Expiry, Gas Cylinder, Barcode) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 flex items-center gap-1.5"
                >
                  {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>ঐচ্ছিক তথ্য (মেয়াদ, গ্যাস সিলিন্ডার বিবরণ, বারকোড)</span>
                </button>

                {showOptionalFields && (
                  <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        মেয়াদ উত্তীর্ণের তারিখ (Expiry Date - ঔষধ/খাবারের জন্য)
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        অতিরিক্ত বিবরণ / ব্রান্ড (যেমন: বেক্সিমকো গ্যাস সিলিন্ডার ১২ কেজি)
                      </label>
                      <input
                        type="text"
                        placeholder="কোম্পানি বা বিশেষ তথ্য"
                        value={extraInfo}
                        onChange={(e) => setExtraInfo(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {t('barcode')} (Barcode)
                      </label>
                      <input
                        type="text"
                        placeholder="বারকোড স্ক্যান বা কোড"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {editingProduct ? t('updateProduct') : t('saveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">স্টক যোগ করুন (Restock)</h3>
              <button onClick={() => setRestockItem(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{restockItem.name}</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {t('stock')}: <span className="font-bold">{restockItem.currentStock} {restockItem.unit}</span>
              </p>
            </div>

            <form onSubmit={handleApplyRestock} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  নতুন যোগ করা পরিমাণ ({restockItem.unit}) *
                </label>
                <input
                  type="number" step="any"
                  min="0"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  নতুন কেনা দাম (৳ - পরিবর্তন হলে)
                </label>
                <input
                  type="number" step="any"
                  value={restockPrice}
                  onChange={(e) => setRestockPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  স্টক বাড়ান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-3 animate-in fade-in">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">পণ্য মুছে ফেলতে চান?</h3>
            <p className="text-xs text-slate-500">
              আপনি কি নিশ্চিত এই পণ্যটি তালিকা থেকে মুছে ফেলতে চান?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  deleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE / DELETE CATEGORIES MODAL */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  ক্যাটাগরি ম্যানেজ ও মুছুন
                </h3>
              </div>
              <button
                onClick={() => setIsManageCategoriesOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Category in Modal */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = newCatNameInput.trim();
                if (trimmed) {
                  if (!dynamicCategories.includes(trimmed as any)) {
                    updateSettings({ customCategories: [...(settings?.customCategories || []), trimmed] });
                  }
                  setNewCatNameInput('');
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newCatNameInput}
                onChange={(e) => setNewCatNameInput(e.target.value)}
                placeholder="নতুন ক্যাটাগরির নাম লিখুন..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!newCatNameInput.trim()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>যোগ করুন</span>
              </button>
            </form>

            {/* List of categories with delete buttons */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {dynamicCategories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  কোনো ক্যাটাগরি অবশিষ্ট নেই। উপরের ফর্ম দিয়ে নতুন ক্যাটাগরি তৈরি করুন অথবা ডিফল্ট ক্যাটাগরি রিস্টোর করুন।
                </div>
              ) : (
                dynamicCategories.map((cat) => {
                  const count = products.filter((p) => p.category === cat).length;
                  const isCustom = (settings?.customCategories || []).includes(cat) || !CATEGORIES.includes(cat as any);

                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="truncate">{cat}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full shrink-0">
                          {count} পণ্য
                        </span>
                        {isCustom ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                            কাস্টম
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ডিফল্ট
                          </span>
                        )}
                      </div>

                      {confirmDeleteCategory === cat ? (
                        <div className="flex items-center gap-1 shrink-0 bg-rose-100 dark:bg-rose-950 p-1 rounded-lg">
                          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">মুছবেন?</span>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategory(null)}
                            className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold rounded text-slate-700 dark:text-slate-300"
                          >
                            না
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded shadow-xs"
                          >
                            হ্যাঁ, মুছুন
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCategory(cat)}
                          className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="এই ক্যাটাগরি সম্পূর্ণ মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              {(settings?.deletedCategories || []).length > 0 ? (
                <button
                  type="button"
                  onClick={handleRestoreDefaultCategories}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  🔄 ডিফল্ট ক্যাটাগরি রিস্টোর করুন
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteCategory(null);
                  setIsManageCategoriesOpen(false);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                ঠিক আছে (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
