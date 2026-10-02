import type { NetworkDictionary } from "./network.en";

const net: NetworkDictionary = {
  nav: "الشبكة",
  helpNav: "طلبات المساعدة",
  title: "شبكة الشركاء",
  subtitle: "كل شريك مع راعيه ومن جنّدهم وعملائه المحتملين وإيراداته وعمولاته — ومن يحتاج إلى شيء منك.",
  kpi: {
    members: "الشركاء", approved: "{n} معتمد", active30d: "نشطون خلال 30 يومًا", prospects: "العملاء المحتملون", paidSales: "المبيعات المدفوعة",
    revenue: "الإيرادات المنسوبة", owed: "العمولات المستحقة", owedHint: "متاحة، يجب دفعها", paid: "العمولات المدفوعة",
    pending: "قيد التحقق", pendingHint: "غير مكتسبة بعد", conversion: "معدل تحويل الشبكة", needAttention: "بحاجة إلى متابعة", openHelp: "طلبات مساعدة مفتوحة",
  },
  conversionHint: "التحويل = المبيعات الأولى المدفوعة ÷ العملاء المحتملين (CRM + العملاء الواردون؛ المشتري الذي لم يُسجَّل كعميل محتمل يُحتسب كواحد). الترتيب ابتداءً من {n} عملاء محتملين.",
  attention: { title: "بحاجة إلى متابعة", empty: "لا أحد يحتاج إلى شيء حاليًا.", more: "+{n} آخرون" },
  needs: {
    application: "طلب انضمام للمراجعة", help: "طلب مساعدة مفتوح", contract: "عقد بانتظارك", payout_due: "دفعة مستحقة",
    fraud: "مؤشر احتيال", disputed: "عمولة متنازع عليها", onboarding: "لم يكمل الإعداد", inactive: "غير نشط منذ 30+ يومًا",
  },
  rank: {
    title: "التصنيفات", revenue: "الأعلى إيرادًا", prospects: "الأكثر عملاء محتملين", recruits: "الأكثر تجنيدًا", conversion: "أفضل معدل تحويل",
    sales: "الأكثر مبيعًا", earned: "الأعلى ربحًا", earnedHint: "متاح + مدفوع", empty: "لا توجد بيانات بعد.",
  },
  table: {
    title: "جميع الشركاء", search: "الاسم، البريد، الرمز، البلد، الراعي…", apply: "تطبيق",
    filters: { all: "الكل", needs: "بحاجة إلى متابعة", pending: "طلبات الانضمام", inactive: "غير نشطين", top: "حققوا مبيعات" },
    sortBy: "ترتيب",
    sorts: { needs: "الأولوية", recent: "الأحدث", name: "الاسم", revenue: "الإيرادات", prospects: "العملاء المحتملون", recruits: "المجنّدون", conversion: "التحويل", sales: "المبيعات", earned: "المكتسب", owed: "المستحق" },
    partner: "الشريك", sponsor: "الراعي", recruits: "المجنّدون", prospects: "المحتملون", sales: "المبيعات", conversion: "التحويل",
    revenue: "الإيرادات", owed: "المستحق", paid: "المدفوع", pending: "قيد التحقق", noSponsor: "—", count: "{n} شريك", empty: "لا يوجد شريك مطابق.", staff: "الفريق",
  },
  tree: { title: "شجرة الرعاية", hint: "من جنّد من. افتح شريكًا لرؤية كل شيء.", network: "{n} في شبكته", sales: "{n} مبيعات" },
  detail: {
    back: "الشبكة", since: "شريك منذ {date}", notFound: "هذا الشريك غير موجود.", sponsor: "الراعي", noSponsor: "انضم بدون راعٍ",
    recruits: "المجنّدون", noRecruits: "لا يوجد مجنّدون بعد.", noNeeds: "لا شيء مطلوب لهذا الشريك.", finance: "مالية هذا الشريك",
    money: {
      title: "المال", revenue: "الإيرادات المنسوبة", available: "مستحق الآن (متاح)", paid: "مدفوع بالفعل",
      pending: "قيد التحقق (غير مكتسب)", disputed: "قيد المراجعة", sponsor: "منها من المجنّدين", minimum: "الحد الأدنى للدفع: {amount}",
    },
    stats: {
      title: "النشاط", clicks: "النقرات (30 يومًا)", lastActivity: "آخر نشاط", never: "لا نشاط بعد", conversion: "التحويل",
      won: "صفقات ناجحة في CRM", leads: "العملاء الواردون", renewals: "التجديدات المدفوعة",
    },
    sections: { prospects: "العملاء المحتملون", leads: "العملاء الواردون", sales: "المبيعات", commissions: "العمولات", payouts: "الدفعات", help: "طلبات المساعدة", contracts: "ملفات العقود" },
    prospect: { contact: "التواصل", stage: "المرحلة", next: "الإجراء التالي", value: "القيمة المحتملة", source: "المصدر", notes: "ملاحظات", added: "أضيف في" },
    commissionRole: "البيع {sale}", empty: "لا شيء بعد.", open: "فتح",
  },
  statuses: { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلق" },
  categories: {
    commission: "عمولة", payout: "دفعة", contract: "عقد / ملف", prospect: "عميل محتمل", sale: "بيع",
    account: "الحساب", technical: "مشكلة تقنية", training: "تدريب / كيف أبيع", other: "أخرى",
  },
  urgencies: { low: "منخفضة", normal: "عادية", high: "عاجل" },
  admin: {
    title: "طلبات المساعدة",
    subtitle: "ما طلبه الشركاء من الفريق، مع حالة حساباتهم وقت الطلب. يتلقاها كل عضو في الفريق أيضًا عبر البريد الإلكتروني.",
    tabs: { open: "للمعالجة", all: "الكل" }, empty: "لا توجد طلبات مساعدة.", context: "الحساب وقت الطلب", related: "مرتبط بـ",
    from: "أُرسل من", note: "رد على الشريك (اختياري، سيراه)", teamNote: "رد الفريق", take: "سأتولاه",
    resolve: "تعليم كمحلول", close: "إغلاق", reopen: "إعادة فتح", partner: "ملف الشريك", saved: "تم الحفظ",
  },
  ctx: {
    affiliate_status: "الحالة", code: "الرمز", sponsor: "الراعي", recruits: "المجنّدون", prospects: "العملاء المحتملون", leads: "العملاء الواردون",
    paid_sales: "المبيعات المدفوعة", revenue_cents: "الإيرادات", available_cents: "المستحق", paid_cents: "المدفوع", pending_cents: "قيد التحقق (غير مكتسب)",
    open_dossiers: "ملفات مفتوحة", open_requests: "طلبات مفتوحة", onboarding_completed: "اكتمل الإعداد", country: "البلد",
    prospect: "عميل محتمل", dossier: "ملف",
  },
  help: {
    nav: "مساعدة",
    title: "اطلب المساعدة من فريق Studio ATS",
    subtitle: "أخبرنا بما تحتاجه. يتلقى الفريق طلبك عبر البريد الإلكتروني مع سياق حسابك (العملاء المحتملون، المبيعات، العمولات)، فلا داعي لإعادة شرح كل شيء.",
    category: "الموضوع", urgency: "الأولوية", urgentHint: "عاجل = عميل ينتظر أو أموال معلّقة.",
    subject: "العنوان", subjectPlaceholder: "في بضع كلمات", message: "طلبك",
    messagePlaceholder: "ما الذي حدث، وما الذي جربته، وما الذي تحتاجه منا.",
    prospect: "العميل المحتمل المعني (اختياري)", dossier: "ملف العقد المعني (اختياري)", none: "لا شيء",
    shared: "يُشارك مع الفريق: حالتك، راعيك، أعداد العملاء المحتملين والمبيعات، أرصدتك، والعميل المحتمل أو الملف الذي تختاره.",
    send: "إرسال إلى الفريق", sending: "جارٍ الإرسال…",
    sent: "تم إرسال الطلب {ref}. تم إبلاغ الفريق عبر البريد الإلكتروني، وستصلك إشعارات عند تقدمه.",
    history: "طلباتي", empty: "لم تطلب المساعدة بعد.", teamNote: "رد الفريق", messages: "تفضّل الدردشة؟ راسل الفريق",
    errors: {
      invalid: "يرجى إدخال عنوان (3 أحرف على الأقل) وطلبك (10 أحرف على الأقل).",
      rate_limited: "طلبات كثيرة خلال الساعة الأخيرة. انتظر قليلًا أو استخدم الرسائل.",
      generic: "تعذّر إرسال الطلب. حاول مرة أخرى أو استخدم الرسائل.",
    },
    ask: "تحتاج مساعدة؟",
  },
};

export default net;
