#!/bin/bash
# SalesPos.tsx
sed -i "s/পণ্যের নাম বা ক্যাটাগরি দিয়ে খুঁজুন.../{t('searchProduct')}/g" src/components/SalesPos.tsx
sed -i "s/সব/{t('allCategories')}/g" src/components/SalesPos.tsx
sed -i "s/>বিক্রির তালিকা</>{t('cart')}</g" src/components/SalesPos.tsx
sed -i "s/পরিমাণ/{t('qty')}/g" src/components/SalesPos.tsx
sed -i "s/দর/{t('price')}/g" src/components/SalesPos.tsx
sed -i "s/মোট/{t('total')}/g" src/components/SalesPos.tsx
sed -i "s/>সাবটোটাল</>{t('subtotal')}</g" src/components/SalesPos.tsx
sed -i "s/ছাড় (৳)/{t('discount')}/g" src/components/SalesPos.tsx
sed -i "s/সর্বমোট বিল/{t('grandTotal')}/g" src/components/SalesPos.tsx
sed -i "s/পরিশোধিত টাকা (৳)/{t('paidAmount')}/g" src/components/SalesPos.tsx
sed -i "s/ফেরত \/ ভাংতি/{t('changeAmount')}/g" src/components/SalesPos.tsx
sed -i "s/বাকি টাকা (৳)/{t('dueAmount')}/g" src/components/SalesPos.tsx
sed -i "s/কাস্টমার সিলেক্ট বা যোগ করুন/{t('selectCustomer')}/g" src/components/SalesPos.tsx
sed -i "s/নগদ ক্রেতা (নাম ছাড়া)/{t('walkInCustomer')}/g" src/components/SalesPos.tsx
sed -i "s/+ নতুন কাস্টমার যোগ/{t('addNewCustomer')}/g" src/components/SalesPos.tsx
sed -i "s/মূল্য পরিশোধ মাধ্যম/{t('paymentMethod')}/g" src/components/SalesPos.tsx
sed -i "s/>বিকাশ</>{t('bkash')}</g" src/components/SalesPos.tsx
sed -i "s/>নগদ</>{t('nagad')}</g" src/components/SalesPos.tsx
sed -i "s/>বাকি</>{t('due')}</g" src/components/SalesPos.tsx
sed -i "s/আংশিক নগদ ও বাকি/{t('split')}/g" src/components/SalesPos.tsx
sed -i "s/বিক্রি নিশ্চিত করুন (৳ {total})/{t('completeSale').replace('{total}', String(grandTotal))}/g" src/components/SalesPos.tsx
sed -i "s/বিক্রি সেভ হচ্ছে.../{t('savingSale')}/g" src/components/SalesPos.tsx
sed -i "s/>কাস্টমার:</>{t('customer')}:</g" src/components/SalesPos.tsx

# ProductsManager.tsx
sed -i "s/দোকানের মালামাল \/ পণ্য/{t('productsList')}/g" src/components/ProductsManager.tsx
sed -i "s/+ নতুন পণ্য যোগ/{t('addProduct')}/g" src/components/ProductsManager.tsx
sed -i "s/পণ্য পরিবর্তন/{t('editProduct')}/g" src/components/ProductsManager.tsx
sed -i "s/পণ্য মুছে ফেলুন/{t('deleteProduct')}/g" src/components/ProductsManager.tsx
sed -i "s/পণ্যের নাম/{t('productName')}/g" src/components/ProductsManager.tsx
sed -i "s/ক্যাটাগরি/{t('category')}/g" src/components/ProductsManager.tsx
sed -i "s/একক (পিস\/কেজি\/লিটার)/{t('unit')}/g" src/components/ProductsManager.tsx
sed -i "s/কেনা দাম (৳)/{t('purchasePrice')}/g" src/components/ProductsManager.tsx
sed -i "s/বিক্রি দাম (৳)/{t('salePrice')}/g" src/components/ProductsManager.tsx
sed -i "s/বর্তমান মজুদ/{t('stock')}/g" src/components/ProductsManager.tsx
sed -i "s/কমপক্ষে মজুদ এলার্ট/{t('minStock')}/g" src/components/ProductsManager.tsx
sed -i "s/অতিরিক্ত নোট \/ তথ্য/{t('extraNotes')}/g" src/components/ProductsManager.tsx
sed -i "s/বারকোড \/ কোড/{t('barcode')}/g" src/components/ProductsManager.tsx
sed -i "s/পণ্য সেভ করুন/{t('saveProduct')}/g" src/components/ProductsManager.tsx
sed -i "s/পণ্য আপডেট করুন/{t('updateProduct')}/g" src/components/ProductsManager.tsx
sed -i "s/আপনি কি নিশ্চিত এই পণ্যটি মুছে ফেলতে চান?/{t('deleteConfirm')}/g" src/components/ProductsManager.tsx

# CustomersManager.tsx
sed -i "s/কাস্টমার ও বাকি খাতা/{t('customerLedger')}/g" src/components/CustomersManager.tsx
sed -i "s/+ নতুন কাস্টমার/{t('addCustomer')}/g" src/components/CustomersManager.tsx
sed -i "s/কাস্টমারের নাম/{t('customerName')}/g" src/components/CustomersManager.tsx
sed -i "s/মোবাইল নম্বর/{t('mobileNumber')}/g" src/components/CustomersManager.tsx
sed -i "s/ঠিকানা \/ পরিচিতি/{t('address')}/g" src/components/CustomersManager.tsx

# ExpensesManager.tsx
sed -i "s/দোকানের দৈনিক খরচ/{t('shopExpenses')}/g" src/components/ExpensesManager.tsx
sed -i "s/+ খরচ যোগ করুন/{t('addExpense')}/g" src/components/ExpensesManager.tsx
sed -i "s/খরচের বিবরণ/{t('expenseTitle')}/g" src/components/ExpensesManager.tsx
sed -i "s/খরচের খাত/{t('expenseCategory')}/g" src/components/ExpensesManager.tsx
sed -i "s/টাকার পরিমাণ (৳)/{t('expenseAmount')}/g" src/components/ExpensesManager.tsx
sed -i "s/খরচ সেভ করুন/{t('saveExpense')}/g" src/components/ExpensesManager.tsx

# ReportsView.tsx
sed -i "s/দোকানের হিসাব ও রিপোর্ট/{t('reportsAnalytics')}/g" src/components/ReportsView.tsx
sed -i "s/আজকের হিসাবের সারাংশ/{t('todaySummary')}/g" src/components/ReportsView.tsx
sed -i "s/চলতি মাসের হিসাব/{t('monthlySummary')}/g" src/components/ReportsView.tsx
sed -i "s/মাসিক মোট বিক্রি/{t('monthlySales')}/g" src/components/ReportsView.tsx
sed -i "s/মাসিক মোট লাভ/{t('monthlyProfit')}/g" src/components/ReportsView.tsx
sed -i "s/কম স্টকের পণ্য তালিকা (অর্ডার প্রয়োজন)/{t('lowStockReport')}/g" src/components/ReportsView.tsx
sed -i "s/বকেয়া পাওনা বাকি তালিকা/{t('dueSummaryReport')}/g" src/components/ReportsView.tsx
sed -i "s/সব পণ্যের পর্যাপ্ত স্টক আছে।/{t('noLowStock')}/g" src/components/ReportsView.tsx

# Common replacements
for file in src/components/*.tsx; do
  sed -i "s/>বাতিল</>{t('cancel')}</g" "$file"
  sed -i "s/>সেভ করুন</>{t('save')}</g" "$file"
  sed -i "s/>এডিট</>{t('edit')}</g" "$file"
  sed -i "s/>ডিলিট</>{t('delete')}</g" "$file"
  sed -i "s/খুঁজুন.../{t('search')}/g" "$file"
  sed -i "s/>ফিল্টার</>{t('filter')}</g" "$file"
  sed -i "s/>অ্যাকশন</>{t('actions')}</g" "$file"
done

