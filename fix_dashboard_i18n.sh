#!/bin/bash
sed -i "s/দোকান হিসাব/{t('shopManagement')}/g" src/components/Dashboard.tsx
sed -i "s/মোট বিক্রি/{t('todaySales')}/g" src/components/Dashboard.tsx
sed -i "s/মোট লাভ/{t('todayProfit')}/g" src/components/Dashboard.tsx
sed -i "s/নিট লাভ:/{t('netProfit')}:/g" src/components/Dashboard.tsx
sed -i "s/মোট বাকি (পাওনা)/{t('totalDue')}/g" src/components/Dashboard.tsx
sed -i "s/বর্তমান মোট মজুদ/{t('currentStock')}/g" src/components/Dashboard.tsx
