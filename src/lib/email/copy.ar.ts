import type { Copy } from "./copy.ts";

/** العربية — transactional emails (RTL). A pending commission is never described as earned. */
const ar: Copy = {
  common: {
    signature: "فريق Studio ATS",
    footer: "تتلقى هذه الرسالة بسبب حسابك أو طلبك لدى Studio ATS. هذه رسالة معاملات.",
    pendingNote: "العمولة المعلّقة لم تُكتسب بعد: تصبح متاحة عند انتهاء فترة التحقق دون استرداد أو نزاع.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "مرحبًا بك في Studio ATS",
      preheader: "مساحة الشريك الخاصة بك جاهزة.",
      title: "مرحبًا بك في Studio ATS.",
      paragraphs: [
        "مساحة الشريك الخاصة بك جاهزة. رمز الإحالة الخاص بك هو {code}.",
        "شارك رابطك، وتابع عملاءك المحتملين، واطّلع على كل عملية بيع وعمولة وتجديد في مكان واحد.",
      ],
      cta: { label: "فتح لوحة التحكم", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "تم إسناد عميل محتمل جديد إليك",
      preheader: "وصل طلب جديد عبر رابطك.",
      title: "تم إسناد عميل محتمل جديد إليك.",
      paragraphs: ["طلب {who} معلومات عن Studio ATS عبر رابطك.", "يتولى فريق Studio ATS التواصل الأول. يمكنك متابعته من لوحة التحكم."],
      cta: { label: "عرض عملائي المحتملين", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "طلب عميل محتمل موعدًا",
      preheader: "وصل طلب موعد عبر رابطك.",
      title: "طلب عميل محتمل موعدًا.",
      paragraphs: ["طلب {who} موعدًا{when}."],
      cta: { label: "عرض عملائي المحتملين", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "عملية بيع جديدة لـ Studio ATS — عمولة {commission} معلّقة",
      preheader: "تم تحقيق {gross}. العمولة بانتظار التحقق.",
      title: "تم تأكيد عملية بيع.",
      paragraphs: [
        "عملية البيع {sale_ref}: دفع العميل {gross}.",
        "عمولتك: {commission} — الحالة: معلّقة. من المتوقع أن تصبح متاحة في {available_on}.",
      ],
      cta: { label: "متابعة عمولاتي", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "جدّد أحد العملاء — عمولة {commission} معلّقة",
      preheader: "تم تجديد عقد جلبته.",
      title: "جدّد للتو عميل جلبته.",
      paragraphs: [
        "التجديد {sale_ref}: تم دفع {gross}.",
        "عمولة التجديد الخاصة بك: {commission} — الحالة: معلّقة. الإتاحة المتوقعة: {available_on}.",
      ],
      cta: { label: "عرض محفظتي المتكررة", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "أصبح مبلغ {commission} متاحًا الآن",
      preheader: "اجتازت عمولتك فترة التحقق.",
      title: "عمولتك متاحة الآن.",
      paragraphs: ["اجتاز مبلغ {commission} فترة التحقق وأصبح متاحًا للصرف."],
      cta: { label: "عرض رصيدي", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "تم إرسال دفعة: {amount}",
      preheader: "تم إصدار دفعة لك.",
      title: "تم إرسال دفعة إليك.",
      paragraphs: ["الدفعة {payout_ref}: {amount}. حسب مصرفك، تصل الأموال عادةً خلال بضعة أيام عمل."],
      cta: { label: "عرض دفعاتي", path: "/dashboard/payouts" },
    },
    "affiliate.customer_cancelled": {
      subject: "تم إلغاء عقد جلبته",
      preheader: "لن يجدد أحد العملاء.",
      title: "تم إلغاء عقد جلبته.",
      paragraphs: [
        "لن يجدد العميل {customer_ref}. ينتهي العقد في {ends_on}.",
        "لا تتأثر العمولات التي تم التحقق منها بالفعل عن الفترات المدفوعة. لن تُنشأ أي عمولة تجديد لهذا العقد.",
      ],
      cta: { label: "عرض محفظتي المتكررة", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "مرحبًا بك في Studio ATS",
      preheader: "تم تأكيد دفعتك.",
      title: "مرحبًا بك في Studio ATS.",
      paragraphs: [
        "تم تأكيد دفعتك واشتراكك في {product} نشط.",
        "سيتواصل معك فريقنا قريبًا للبدء. يرسل إليك مزوّد الدفع لدينا، Stripe، الإيصال والفواتير.",
      ],
    },
    "customer.order_confirmation": {
      subject: "طلبك من Studio ATS رقم {sale_ref}",
      preheader: "تم تأكيد الطلب.",
      title: "تم تأكيد طلبك.",
      paragraphs: ["الطلب {sale_ref}: تم دفع {amount}."],
    },
    "customer.renewal_receipt": {
      subject: "تم تجديد اشتراكك في Studio ATS",
      preheader: "تم تأكيد التجديد.",
      title: "تم تجديد اشتراكك.",
      paragraphs: ["التجديد {sale_ref}: تم دفع {amount}. شكرًا لثقتك."],
    },
    "customer.payment_failed": {
      subject: "لم تتم دفعتك إلى Studio ATS",
      preheader: "يرجى تحديث وسيلة الدفع.",
      title: "لم تتم دفعتك.",
      paragraphs: ["لم نتمكن من تحصيل {amount}. ربما رفض مصرفك الدفع. سنعيد المحاولة تلقائيًا؛ ويمكنك أيضًا تحديث وسيلة الدفع من الرابط الوارد في بريد مزوّد الدفع لدينا."],
    },
    "customer.cancellation": {
      subject: "تم تأكيد إلغاء اشتراكك في Studio ATS",
      preheader: "تم تأكيد الإلغاء.",
      title: "تم تأكيد الإلغاء.",
      paragraphs: ["لن يتم تجديد اشتراكك. يبقى وصولك متاحًا حتى {ends_on}.", "إذا كان ذلك عن طريق الخطأ، فما عليك سوى الرد على هذه الرسالة."],
    },
    "lead.confirmation": {
      subject: "استلمنا طلبك — Studio ATS",
      preheader: "سنعود إليك قريبًا.",
      title: "شكرًا، استلمنا طلبك.",
      paragraphs: ["سيتواصل معك أحد أعضاء فريق Studio ATS قريبًا جدًا."],
    },
    "lead.appointment_confirmation": {
      subject: "طلب موعدك مع Studio ATS",
      preheader: "سنؤكد الموعد معك.",
      title: "استلمنا طلب موعدك.",
      paragraphs: ["سنؤكد الموعد معك{when}."],
    },
    "dossier.invite": {
      subject: "أكمل كراسة متطلبات مشروعك لدى Studio ATS - {reference}",
      preheader: "مساحة مشروعك الآمنة جاهزة.",
      title: "حدّثنا عن مشروعك.",
      paragraphs: ["أنشأ مستشارك في Studio ATS الملف {reference}.", "استخدم الرابط الآمن أدناه لإكمال كراسة المتطلبات. الرابط شخصي وتنتهي صلاحيته تلقائيًا."],
      cta: { label: "فتح ملفي", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "تعديلات مطلوبة على الملف {reference}",
      preheader: "ترك مستشارك تعليقًا.",
      title: "بعض التفاصيل تحتاج إلى انتباهك.",
      paragraphs: ["التعليق: {comment}", "افتح الملف الآمن لتحديثه وإرسال مراجعة جديدة."],
      cta: { label: "تحديث ملفي", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "عرض السعر من Studio ATS جاهز - {reference}",
      preheader: "راجع الكراسة وعرض السعر المقفلين.",
      title: "مستنداتك جاهزة للموافقة.",
      paragraphs: ["راجع كراسة المتطلبات وعرض السعر كما أُعدّا تمامًا للملف {reference}.", "عندما تكون جاهزًا، اطلب الرمز لمرة واحدة لتأكيد موافقتك."],
      cta: { label: "مراجعة مستنداتي", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "رمز الموافقة الخاص بك لدى Studio ATS",
      preheader: "تنتهي صلاحية هذا الرمز خلال 10 دقائق.",
      title: "رمزك لمرة واحدة هو {otp}.",
      paragraphs: ["أدخل هذا الرمز للموافقة على الملف {reference}.", "تنتهي صلاحيته خلال 10 دقائق ولا يمكن استخدامه إلا مرة واحدة."],
    },
    "dossier.payment": {
      subject: "أكمل الدفع لـ Studio ATS - {reference}",
      preheader: "تم التوقيع المقابل على ملفك.",
      title: "تمت الموافقة الكاملة على ملفك لدى Studio ATS.",
      paragraphs: ["وقّعت Studio ATS توقيعًا مقابلًا على المستندات المقفلة نفسها.", "ادفع الدفعة الأولى عبر Stripe ليصبح الطلب ملزمًا."],
      cta: { label: "الدفع بأمان", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "تم تأكيد طلبك من Studio ATS - {reference}",
      preheader: "تم تأكيد الدفع.",
      title: "يمكن أن يبدأ مشروعك مع Studio ATS.",
      paragraphs: ["استلمنا الدفعة الأولى للملف {reference}.", "تبقى مستنداتك المعتمدة وسجل الإثبات متاحة في ملفك الآمن."],
      cta: { label: "فتح ملفي", path: "{access_path}" },
    },
    "system.test": {
      subject: "Studio ATS — رسالة اختبار",
      preheader: "إرسال البريد الإلكتروني يعمل.",
      title: "إرسال البريد الإلكتروني يعمل.",
      paragraphs: ["أُرسل هذا الاختبار من إعدادات الإدارة في Studio ATS. إذا كان بإمكانك قراءته، فإن رموز الدخول والإشعارات تصل إلى مستخدميك."],
    },
    "auth.login_code": {
      subject: "رمز الدخول إلى Studio ATS: {code}",
      preheader: "صالح لمدة 5 دقائق ولمرة واحدة.",
      title: "رمز الدخول الخاص بك",
      paragraphs: ["أدخل هذا الرمز على Studio ATS لتسجيل الدخول. إنه صالح لمدة 5 دقائق ويعمل مرة واحدة فقط."],
      highlight: "{code}",
      footnote: "إذا لم تطلب هذا الرمز، فتجاهل هذه الرسالة ولا تشارك الرمز أبدًا.",
    },
  },
};

export default ar;
