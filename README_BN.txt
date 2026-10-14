Rokomari Inventory — Frontend-only Starter (Bangla)

চালু করা:
1. ZIP extract করুন।
2. index.html ব্রাউজারে খুলুন অথবা static hosting-এ আপলোড করুন।
3. Vercel static deployment-এর জন্য এই ফাইলগুলো একই directory-তে রাখুন।

এই সংস্করণে Supabase, backend, API বা database নেই। পণ্য, স্টক, বিক্রয়, পণ্যের মূল্য এবং খরচ একই ব্রাউজারের Local Storage-এ থাকে।

সীমাবদ্ধতা:
- অন্য ডিভাইস/ব্রাউজারে ডেটা সিঙ্ক হবে না।
- ব্রাউজারের site data মুছে ফেললে ডেটা হারাতে পারে।
- এটি frontend-only; একাধিক কর্মচারী, অনলাইন ব্যাকআপ, নিরাপদ লগইন বা server-side permissions নেই।
- গুরুত্বপূর্ণ ব্যবসার হিসাবের একমাত্র কপি হিসেবে ব্যবহার করবেন না। নিয়মিত export/backup ব্যবস্থা না থাকায় ডেটা হারানোর ঝুঁকি আছে।

ফাইল:
- index.html: পেজের গঠন
- style.css: ডিজাইন
- app.js: Local Storage-ভিত্তিক frontend আচরণ
