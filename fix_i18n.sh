#!/bin/bash
sed -i "s/টাকা জমা নিন (Payment Entry)/{t('receivePayment')}/g" src/components/CustomersManager.tsx
sed -i "s/জমা দেওয়ার পরিমাণ (৳) \*/{t('enterPaymentAmount')} \*/g" src/components/CustomersManager.tsx
sed -i "s/<span>কাস্টমার:<\/span>/<span>{t('customer')}:<\/span>/g" src/components/CustomersManager.tsx
sed -i "s/<span>বর্তমান বাকি:<\/span>/<span>{t('totalCustomerDue')}:<\/span>/g" src/components/CustomersManager.tsx
sed -i "s/জমা সেভ করুন/{t('save')}/g" src/components/CustomersManager.tsx
sed -i "s/বাতিল/{t('cancel')}/g" src/components/CustomersManager.tsx
sed -i "s/পরিশোধ মাধ্যম/{t('paymentMethod')}/g" src/components/CustomersManager.tsx
sed -i "s/নগদ/{t('cash')}/g" src/components/CustomersManager.tsx
