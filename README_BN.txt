ROKOMARI INVENTORY — HOSTINGER UPLOAD

এই ZIP-এ একটি প্রাথমিক ওয়েব অ্যাপ, CSS/JS এবং Supabase SQL setup আছে।
এটি এখনো সম্পূর্ণ production-tested অ্যাপ নয়। Hostinger-এ ফাইল আপলোড করলেই ওয়েবসাইটের পেজ দেখা যাবে, কিন্তু ডেটাবেসে কাজ করাতে Supabase setup সম্পন্ন করতে হবে।

ধাপ ১ — Hostinger
1. ZIP extract করুন।
2. Hostinger hPanel > Websites > Manage > File Manager খুলুন।
3. public_html ফোল্ডারে যান।
4. এই ZIP-এর index.html, style.css, app.js ফাইল public_html-এ upload করুন। ZIP-এর ভিতরের ফাইলগুলো সরাসরি public_html-এ রাখবেন, অতিরিক্ত nested folder-এ নয়।
5. supabase_setup.sql এবং README ফাইল public_html-এ রাখার দরকার নেই; নিজের কাছে রাখুন।
6. আপনার domain খুলে পেজ পরীক্ষা করুন। ডোমেইন/SSL সক্রিয় হতে কিছু সময় লাগতে পারে।

ধাপ ২ — Supabase
1. Supabase Dashboard > SQL Editor খুলুন।
2. supabase_setup.sql ফাইলটি খুলে পুরো SQL কপি করে SQL Editor-এ দিন।
3. Run করার আগে নিশ্চিত হোন যে এটি সঠিক project; গুরুত্বপূর্ণ ডেটা থাকলে আগে backup নিন।
4. Authentication > Users থেকে আপনার নিজের account UUID দেখুন।
5. SQL Editor-এ নিচের SQL চালিয়ে নিজের অ্যাকাউন্ট admin করুন (UUID বদলাবেন):
   insert into public.user_roles(user_id, role)
   values ('YOUR_AUTH_USER_UUID'::uuid, 'admin')
   on conflict(user_id) do update set role='admin';
6. ওয়েবসাইট খুলে Supabase Project URL এবং publishable/anon key দিন। Secret/service_role key দেবেন না।
7. প্রথমে নিজের admin account দিয়ে পরীক্ষা করুন। এরপর employee account তৈরি করে পরীক্ষা করুন।

সীমাবদ্ধতা/গুরুত্বপূর্ণ
- এটি একটি প্রাথমিক starter app, এখনো real-world production use-এর জন্য পূর্ণ পরীক্ষা করা হয়নি।
- বর্তমান UI-তে sales history admin-only policy অনুযায়ী employee-রা বিক্রয় ইতিহাস পড়তে পারবে না; এটি ইচ্ছাকৃত নিরাপত্তা আচরণ হতে পারে, কিন্তু আপনার প্রয়োজন অনুযায়ী employee sales history দরকার হলে আলাদা নিরাপদ policy/function design করতে হবে।
- Profit/loss report এখনো যোগ করা হয়নি; শুধু admin-only product prices ও expenses entry/list আছে।
- Returns, stock adjustment, employee management screen, password reset UI, full reports, backup/restore, export এবং detailed audit reports এখনো নেই।
- Supabase Auth-এ Email confirmation চালু থাকলে signup-এর পর email verify করতে হবে।
- SQL run করার সময় error এলে বার্তাটি দেখে ঠিক না করে বারবার SQL চালাবেন না।
- service_role/secret key কখনো frontend বা APK-তে দেবেন না।
