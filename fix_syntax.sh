#!/bin/bash
# Check for any {t('...')} inside single quotes or ternary that could be broken
sed -i "s/'{t('\([^']*\)')}'/t('\1')/g" src/components/*.tsx
