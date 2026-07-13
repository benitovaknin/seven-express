'use client'

export default function AboutBanner() {
  const checks = [
    'שירות אישי המותאם לעסקים',
    'מגוון רחב של מוצרים טריים ואיכותיים',
    'אספקה מהירה בזכות הקרבה למשרדים',
    'הזמנות קבועות וניהול מלאי למקומות עבודה',
    'פתרון מיידי גם לחוסרים בלתי צפויים במהלך היום',
  ]

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
      <div className="flex flex-col md:flex-row items-stretch">

        {/* Image — left side (RTL: start side) */}
        <div className="md:w-2/5 flex-shrink-0 bg-gray-900 min-h-64 md:min-h-auto">
          <img
            src="/office.jpg"
            alt="Seven Express Business"
            className="w-full h-full object-cover"
            style={{ minHeight: '340px' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>

        {/* Text — right side */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center text-right">

          {/* Eyebrow */}
          <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-4 w-fit ms-auto">
            Seven Express Business Market
          </span>

          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug mb-3">
            אנחנו כאן כדי לדאוג שהמשרד שלכם
            <span className="text-blue-600"> תמיד יהיה מוכן</span> ליום העבודה
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6">
            מספקת לחברות ועסקים את כל צורכי הסופר והמשרד במקום אחד – מוצרי חלב, פירות וירקות טריים, שתייה, חטיפים, עוגות, עוגיות, מוצרי ניקיון וציוד משרדי.
          </p>

          {/* Checklist */}
          <ul className="space-y-2.5 mb-6">
            {checks.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-gray-700 leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          {/* Footer line */}
          <p className="text-sm font-semibold text-gray-800 border-t border-gray-100 pt-4">
            יותר מספק – שותפים לשגרת העבודה של העסק שלכם. 🚀
          </p>
        </div>
      </div>
    </section>
  )
}
