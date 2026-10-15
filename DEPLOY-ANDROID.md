# نشر نسخة Yourlift Botpress التجريبية من الهاتف

الكود حاضر فـ GitHub branch:
feature/botpress-yourlift-poc

المسار:
botpress-poc/

1) فتح Vercel من الهاتف (Chrome > Desktop site إذا كانت الصفحة صغيرة).
2) Add New > Project > Import Git Repository: Swamiesco/Yourlift-app.
3) مشروع جديد فقط باسم yourlift-botpress-poc. لا تختار المشروع
   الموجود yourlift-app، ولا تستورد فوقه.
4) Root Directory = botpress-poc.
5) Production Branch = feature/botpress-yourlift-poc.
   تأكّد من اسم الـbranch قبل Deploy.
6) Framework Preset = Other. Build Command = empty.
   ما تضيف حتى بطاقة بنكية.
7) Deploy. منين يعطيك رابط جديد اختبرو من الهاتف.

إذا Vercel ما خلاكش تختار Production Branch قبل النشر،
ما تنشرش main ديال Yourlift؛ رجع وخلينا نراجع إعدادات Git.

الفترة الأولى: تجربة يدوية داخل الموقع.
Botpress integration بـ POST /api/quote باقية غير مفعلة حتى يكون
secret قوي مخزّن في Vercel وBotpress، ويتأكد المستخدم من حدود الصرف.

تجربة:
ATLAS 3 Variateurs × 700 MAD HT, TVA 20%:
HT = 2100 MAD, TVA = 420 MAD, TTC = 2520 MAD.

BETA 4 Contacteurs × 180 MAD بدون HT/TTC أو TVA:
المجموع الخام = 720 MAD، لكن خاص نسول على HT/TTC وTVA
وما نسميوش TTC حتى يتم التوضيح.

النسخة كتخرج PDF "SIMULATION" فقط، بلا توقيع ولا بيانات فعلية.
لا يوجد أي اتصال بقاعدة بيانات Supabase أو نظام Yourlift الأصلي.
