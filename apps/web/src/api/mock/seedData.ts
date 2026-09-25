/* Static demo content used by the mock seed generator. */
import type { SubjectColor } from '@edu/shared';

export const MALE_NAMES = ['Jasur', 'Sardor', 'Bekzod', 'Otabek', 'Aziz', 'Javohir', 'Shohruh', 'Doniyor', 'Sanjar', 'Timur', 'Ulugbek', 'Farrux', 'Islom', 'Abdulloh', 'Behruz', 'Diyor', 'Asadbek', 'Jahongir', 'Mirjalol', 'Nodirbek', 'Oybek', 'Rustam', 'Sherzod', 'Temurbek', 'Xurshid', 'Yusuf', 'Zafar', 'Akmal', 'Bobur', 'Eldor'];
export const FEMALE_NAMES = ['Malika', 'Nilufar', 'Dilnoza', 'Madina', 'Sevara', 'Zarina', 'Kamola', 'Mohinur', 'Shahnoza', 'Gulnora', 'Nodira', 'Laylo', 'Munisa', 'Sabina', 'Feruza', 'Mushtariy', 'Oydin', 'Robiya', 'Sitora', 'Durdona', 'Hilola', 'Iroda', 'Charos', 'Umida'];
export const LAST_NAME_ROOTS = ['Karimov', 'Rahimov', 'Yusupov', 'Aliyev', 'Tursunov', 'Nazarov', 'Qodirov', 'Ismoilov', 'Xolmatov', 'Mirzayev', 'Sobirov', 'Ergashev', 'Abdullayev', 'Umarov', 'Hasanov', 'Rustamov', 'Saidov', 'Jo\'rayev', 'Toshmatov', 'Olimov', 'Sharipov', 'Normatov', 'Qosimov', 'Hamidov', 'Mahmudov', 'Raximberdiyev', 'Yo\'ldoshev', 'Boboyev', 'Zokirov', 'Fayzullayev'];

export const FACULTIES = [
  { key: 'DI', name: 'Dasturiy injiniring fakulteti', shortName: 'DI' },
  { key: 'KI', name: 'Kompyuter injiniringi fakulteti', shortName: 'KI' },
  { key: 'AX', name: 'Kiberxavfsizlik fakulteti', shortName: 'KX' },
] as const;

export const DEPARTMENTS = [
  { key: 'dt', faculty: 'DI', name: 'Dasturlash texnologiyalari kafedrasi' },
  { key: 'si', faculty: 'DI', name: "Sun'iy intellekt kafedrasi" },
  { key: 'kt', faculty: 'KI', name: 'Kompyuter tizimlari kafedrasi' },
  { key: 'om', faculty: 'KI', name: 'Oliy matematika kafedrasi' },
  { key: 'kr', faculty: 'AX', name: 'Kriptologiya kafedrasi' },
  { key: 'xt', faculty: 'AX', name: 'Xorijiy tillar kafedrasi' },
] as const;

export interface SubjectSeed {
  key: string;
  name: string;
  code: string;
  credits: number;
  color: SubjectColor;
  dept: string;
  description: string;
  topics: string[];
}

export const SUBJECTS: SubjectSeed[] = [
  {
    key: 'py', name: 'Dasturlash asoslari (Python)', code: 'DI101', credits: 6, color: 'violet', dept: 'dt',
    description: "Python tilida algoritmik fikrlash, ma'lumot turlari, funksiyalar va OOP asoslari.",
    topics: ['Kirish. Python muhiti va birinchi dastur', "O'zgaruvchilar va ma'lumot turlari", 'Shart operatorlari', 'Sikllar: for va while', "Ro'yxatlar, kortejlar va lug'atlar", 'Funksiyalar va rekursiya', 'Fayllar bilan ishlash', 'Istisnolarni qayta ishlash', 'OOP: klasslar va obyektlar', 'Modullar va paketlar'],
  },
  {
    key: 'algo', name: "Ma'lumotlar tuzilmasi va algoritmlar", code: 'DI201', credits: 6, color: 'indigo', dept: 'dt',
    description: 'Asosiy tuzilmalar, saralash va qidiruv algoritmlari, murakkablik tahlili.',
    topics: ['Algoritm murakkabligi: Big-O', "Massivlar va bog'langan ro'yxatlar", 'Stek va navbat', 'Saralash algoritmlari', 'Binar qidiruv', 'Xesh-jadvallar', 'Daraxtlar va BST', 'Uyum (Heap) va ustuvor navbat', 'Graflar: BFS va DFS', 'Dinamik dasturlash'],
  },
  {
    key: 'web', name: 'Web dasturlash (React)', code: 'DI301', credits: 5, color: 'sky', dept: 'dt',
    description: 'HTML/CSS, zamonaviy JavaScript, React va TypeScript bilan SPA yaratish.',
    topics: ['Web qanday ishlaydi: HTTP va brauzer', 'Semantik HTML va zamonaviy CSS', 'JavaScript ES2024 asoslari', 'DOM va hodisalar', 'TypeScript asoslari', 'React: komponentlar va props', 'State, hooks va effektlar', 'Routing va lazy-loading', 'Holat boshqaruvi: Zustand', 'REST API va React Query'],
  },
  {
    key: 'db', name: "Ma'lumotlar bazasi (PostgreSQL)", code: 'DI202', credits: 5, color: 'emerald', dept: 'dt',
    description: "Relyatsion model, SQL, normallashtirish, indekslar va tranzaksiyalar.",
    topics: ["Ma'lumotlar bazasi tushunchasi", 'Relyatsion model va ER diagramma', 'SQL: SELECT va filtrlash', "JOIN turlari", 'Agregat funksiyalar va GROUP BY', 'Normallashtirish (1NF–3NF)', 'Indekslar va EXPLAIN', 'Tranzaksiyalar va ACID', "Ko'rinishlar va triggerlar", 'Prisma ORM bilan ishlash'],
  },
  {
    key: 'ux', name: 'UI/UX dizayn asoslari', code: 'DI203', credits: 4, color: 'pink', dept: 'si',
    description: 'Foydalanuvchi tadqiqoti, prototiplash, dizayn tizimlari va Figma.',
    topics: ['UX nima va nega muhim', 'Foydalanuvchi tadqiqoti', 'Persona va CJM', 'Wireframe va prototip', 'Tipografiya va rang', 'Grid va kompozitsiya', 'Dizayn tizimlari', 'Figma: Auto layout va komponentlar', 'Usability test', 'Portfolio tayyorlash'],
  },
  {
    key: 'ai', name: "Sun'iy intellekt asoslari", code: 'AI301', credits: 5, color: 'amber', dept: 'si',
    description: "Mashinali o'qitish, neyron tarmoqlar va zamonaviy LLM yondashuvlari.",
    topics: ["Sun'iy intellekt tarixi va yo'nalishlari", "Ma'lumotlarni tayyorlash", 'Chiziqli regressiya', 'Klassifikatsiya: logistik regressiya', "Qaror daraxtlari va ansambllar", 'Klasterlash: K-means', 'Neyron tarmoqlar asoslari', 'CNN va kompyuter ko\'rish', 'Transformerlar va LLM', 'AI etikasi'],
  },
  {
    key: 'math', name: 'Oliy matematika', code: 'MA101', credits: 6, color: 'rose', dept: 'om',
    description: 'Chiziqli algebra, matematik analiz va differensial tenglamalar.',
    topics: ['Matritsalar va determinantlar', 'Chiziqli tenglamalar sistemasi', 'Vektorlar algebrasi', 'Funksiya limiti', 'Hosila va uning tatbiqlari', "Aniqmas integral", 'Aniq integral', "Ko'p o'zgaruvchili funksiyalar", 'Qatorlar', 'Differensial tenglamalar'],
  },
  {
    key: 'dm', name: 'Diskret matematika', code: 'MA102', credits: 4, color: 'teal', dept: 'om',
    description: "To'plamlar, mantiq, kombinatorika va graflar nazariyasi.",
    topics: ["To'plamlar nazariyasi", 'Mulohazalar mantiqi', 'Predikatlar mantiqi', 'Matematik induksiya', 'Kombinatorika', "Munosabatlar va funksiyalar", 'Graflar nazariyasi asoslari', 'Daraxtlar', 'Bul algebrasi', 'Chekli avtomatlar'],
  },
  {
    key: 'net', name: 'Kompyuter tarmoqlari', code: 'KI201', credits: 5, color: 'cyan', dept: 'kt',
    description: 'OSI/TCP-IP modellari, marshrutlash, tarmoq xizmatlari va xavfsizlik.',
    topics: ['Tarmoq turlari va topologiyalar', 'OSI va TCP/IP modellari', 'IP-adreslash va subnetting', 'Kommutatorlar va VLAN', 'Marshrutlash protokollari', 'TCP va UDP', 'DNS va DHCP', 'HTTP/HTTPS va TLS', 'Wi-Fi texnologiyalari', 'Tarmoq xavfsizligi asoslari'],
  },
  {
    key: 'os', name: 'Operatsion tizimlar', code: 'KI202', credits: 4, color: 'orange', dept: 'kt',
    description: 'Jarayonlar, xotira boshqaruvi, fayl tizimlari va Linux amaliyoti.',
    topics: ['OT vazifalari va arxitekturasi', 'Jarayonlar va oqimlar', 'Rejalashtirish algoritmlari', 'Sinxronizatsiya', 'Deadlock', 'Xotira boshqaruvi', 'Virtual xotira', 'Fayl tizimlari', 'Linux buyruqlar qatori', 'Konteynerlar: Docker'],
  },
  {
    key: 'crypto', name: 'Kriptografiya asoslari', code: 'AX301', credits: 5, color: 'violet', dept: 'kr',
    description: 'Simmetrik va asimmetrik shifrlash, xesh funksiyalar, raqamli imzo.',
    topics: ['Kriptografiya tarixi', 'Klassik shifrlar', 'Simmetrik shifrlash: AES', 'Blok shifrlash rejimlari', 'Asimmetrik shifrlash: RSA', 'Diffie–Hellman', 'Xesh funksiyalar', 'Raqamli imzo', 'PKI va sertifikatlar', 'Zamonaviy protokollar'],
  },
  {
    key: 'en', name: 'Ingliz tili (IELTS)', code: 'EN101', credits: 3, color: 'pink', dept: 'xt',
    description: 'Akademik ingliz tili: reading, writing, listening va speaking.',
    topics: ['Diagnostic test', 'Reading: skimming & scanning', 'Listening: note completion', 'Writing Task 1: graphs', 'Writing Task 2: essays', 'Speaking Part 1', 'Speaking Part 2: cue cards', 'Vocabulary: academic words', 'Grammar: complex sentences', 'Mock exam'],
  },
];

export interface GroupSeed {
  name: string;
  faculty: 'DI' | 'KI' | 'AX';
  course: number;
  language: 'uz' | 'ru' | 'en';
  subjects: string[];
}

export const GROUPS: GroupSeed[] = [
  { name: 'DI-101', faculty: 'DI', course: 1, language: 'uz', subjects: ['py', 'math', 'dm', 'en', 'ux'] },
  { name: 'DI-201', faculty: 'DI', course: 2, language: 'uz', subjects: ['algo', 'db', 'web', 'math', 'en'] },
  { name: 'DI-301', faculty: 'DI', course: 3, language: 'uz', subjects: ['web', 'ai', 'ux', 'db', 'os'] },
  { name: 'KI-201', faculty: 'KI', course: 2, language: 'ru', subjects: ['net', 'os', 'dm', 'algo', 'math'] },
  { name: 'KI-301', faculty: 'KI', course: 3, language: 'uz', subjects: ['net', 'ai', 'crypto', 'web', 'en'] },
  { name: 'KX-201', faculty: 'AX', course: 2, language: 'uz', subjects: ['crypto', 'net', 'dm', 'math', 'os'] },
];

export interface TeacherSeed {
  first: string;
  last: string;
  female: boolean;
  dept: string;
  position: 'assistant' | 'senior' | 'docent' | 'professor' | 'head';
  degree?: string;
  subjects: string[];
  email?: string;
}

export const TEACHERS: TeacherSeed[] = [
  { first: 'Aziz', last: 'Karimov', female: false, dept: 'dt', position: 'docent', degree: 'PhD', subjects: ['py', 'algo', 'web'], email: 'teacher@bilimdon.uz' },
  { first: 'Nodira', last: 'Yusupova', female: true, dept: 'si', position: 'professor', degree: 'DSc', subjects: ['ai', 'ux'] },
  { first: 'Sardor', last: 'Rahimov', female: false, dept: 'dt', position: 'senior', subjects: ['db', 'web'] },
  { first: 'Malika', last: 'Tursunova', female: true, dept: 'om', position: 'docent', degree: 'PhD', subjects: ['math', 'dm'] },
  { first: 'Jasur', last: 'Aliyev', female: false, dept: 'kt', position: 'assistant', subjects: ['os', 'net'] },
  { first: 'Dilnoza', last: 'Qodirova', female: true, dept: 'xt', position: 'senior', subjects: ['en'] },
  { first: 'Bekzod', last: 'Nazarov', female: false, dept: 'kt', position: 'docent', degree: 'PhD', subjects: ['net', 'os'] },
  { first: 'Gulnora', last: 'Ismoilova', female: true, dept: 'om', position: 'professor', degree: 'DSc', subjects: ['math', 'dm'] },
  { first: 'Otabek', last: 'Xolmatov', female: false, dept: 'kr', position: 'head', degree: 'DSc', subjects: ['crypto'] },
  { first: 'Shahnoza', last: 'Mirzayeva', female: true, dept: 'dt', position: 'assistant', subjects: ['algo', 'py', 'db'] },
];

export const ROOMS = ['A-101', 'A-204', 'A-305', 'B-112', 'B-210', 'B-318', 'C-104', 'C-207', 'IT-Lab 1', 'IT-Lab 2', 'IT-Lab 3'];
export const LECTURE_HALLS = ['Katta zal 1', 'Katta zal 2', 'Aula 3', 'Konferens-zal'];

export const SAMPLE_FILES = {
  pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  videos: [
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
  ],
  image: (seed: string) => `https://picsum.photos/seed/${seed}/1280/720`,
};

export const SUBJECT_LINKS: Record<string, string> = {
  py: 'https://docs.python.org/3/tutorial/',
  algo: 'https://visualgo.net/en',
  web: 'https://react.dev/learn',
  db: 'https://www.postgresql.org/docs/current/tutorial.html',
  ux: 'https://www.nngroup.com/articles/',
  ai: 'https://www.deeplearning.ai/resources/',
  math: 'https://www.khanacademy.org/math',
  dm: 'https://www.geeksforgeeks.org/discrete-mathematics-tutorial/',
  net: 'https://www.cloudflare.com/learning/',
  os: 'https://linuxjourney.com/',
  crypto: 'https://cryptohack.org/',
  en: 'https://www.ielts.org/for-test-takers/sample-test-questions',
};

export const ASSIGNMENT_TEMPLATES = [
  { type: 'practice' as const, title: 'Amaliy ish', desc: "Mavzu bo'yicha amaliy vazifalarni bajaring va natijani PDF yoki arxiv ko'rinishida yuklang. Kod izohlar bilan yozilishi shart." },
  { type: 'homework' as const, title: 'Uy vazifasi', desc: "Darslikdagi mashqlarni yeching. Har bir yechim bosqichma-bosqich tushuntirilishi kerak." },
  { type: 'lab' as const, title: 'Laboratoriya ishi', desc: "Laboratoriya topshirig'ini bajaring: hisobot (maqsad, jarayon, natija, xulosa) va skrinshotlarni ilova qiling." },
  { type: 'project' as const, title: 'Mini loyiha', desc: "Kichik jamoaviy yoki individual loyiha. GitHub havolasi va qisqa taqdimot (5–7 slayd) talab qilinadi." },
  { type: 'essay' as const, title: 'Referat', desc: "Berilgan mavzuda 5–7 betlik referat tayyorlang. Kamida 5 ta manbaga havola bering." },
];

type Q = { text: string; options: string[]; correct: number[]; type?: 'single' | 'multiple' | 'truefalse' };

export const QUESTION_BANK: Record<string, Q[]> = {
  py: [
    { text: 'Python’da ro‘yxat uzunligini qaysi funksiya qaytaradi?', options: ['size()', 'len()', 'count()', 'length()'], correct: [1] },
    { text: '`print(type(3.0))` natijasi nima?', options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"], correct: [1] },
    { text: 'Qaysilari o‘zgarmas (immutable) turlar?', options: ['tuple', 'list', 'str', 'dict'], correct: [0, 2], type: 'multiple' },
    { text: '`range(2, 10, 3)` qanday qiymatlarni beradi?', options: ['2, 5, 8', '2, 4, 6, 8', '3, 6, 9', '2, 5, 8, 11'], correct: [0] },
    { text: 'Python’da funksiya qaysi kalit so‘z bilan e’lon qilinadi?', options: ['function', 'func', 'def', 'lambda'], correct: [2] },
    { text: 'Lug‘at (dict) kalitlari takrorlanishi mumkin.', options: ["To'g'ri", "Noto'g'ri"], correct: [1], type: 'truefalse' },
    { text: 'Istisnoni ushlash uchun qaysi blok ishlatiladi?', options: ['try / except', 'catch / throw', 'if / else', 'do / while'], correct: [0] },
    { text: '`[x*2 for x in range(3)]` natijasi?', options: ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '[1, 2, 3]'], correct: [0] },
  ],
  algo: [
    { text: 'Binar qidiruvning vaqt murakkabligi qanday?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correct: [1] },
    { text: 'Qaysi tuzilma LIFO tamoyilida ishlaydi?', options: ['Navbat', 'Stek', 'Daraxt', 'Graf'], correct: [1] },
    { text: 'O(n log n) o‘rtacha murakkablikka ega saralashlar:', options: ['Quick sort', 'Merge sort', 'Bubble sort', 'Heap sort'], correct: [0, 1, 3], type: 'multiple' },
    { text: 'BFS qaysi tuzilmadan foydalanadi?', options: ['Stek', 'Navbat', 'Uyum', 'Xesh-jadval'], correct: [1] },
    { text: 'Xesh-jadvalda qidiruvning o‘rtacha murakkabligi O(1).', options: ["To'g'ri", "Noto'g'ri"], correct: [0], type: 'truefalse' },
    { text: 'Balanslangan BST balandligi taxminan:', options: ['n', 'log n', 'n²', '√n'], correct: [1] },
    { text: 'Dinamik dasturlashning asosiy g‘oyasi:', options: ['Tasodifiy tanlash', 'Qism masalalar natijasini saqlash', 'Ochko‘z tanlov', 'Rekursiyasiz ishlash'], correct: [1] },
  ],
  web: [
    { text: 'React’da holatni saqlash uchun asosiy hook qaysi?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correct: [1] },
    { text: 'HTTP 404 status kodi nimani bildiradi?', options: ['Server xatosi', 'Topilmadi', 'Ruxsat yo‘q', 'Muvaffaqiyatli'], correct: [1] },
    { text: 'Semantik HTML teglarini tanlang:', options: ['<article>', '<div>', '<nav>', '<span>'], correct: [0, 2], type: 'multiple' },
    { text: '`const` bilan e’lon qilingan obyekt xossalarini o‘zgartirib bo‘lmaydi.', options: ["To'g'ri", "Noto'g'ri"], correct: [1], type: 'truefalse' },
    { text: 'CSS’da elementlarni bir o‘q bo‘ylab joylashtirish uchun:', options: ['Grid', 'Flexbox', 'Float', 'Table'], correct: [1] },
    { text: 'React.lazy nima uchun ishlatiladi?', options: ['Holat boshqaruvi', 'Komponentni kechiktirib yuklash', 'Animatsiya', 'Formalar'], correct: [1] },
    { text: 'TypeScript’da ixtiyoriy xossa qanday belgilanadi?', options: ['name!: string', 'name?: string', 'name: string?', 'optional name'], correct: [1] },
  ],
  db: [
    { text: 'Jadvaldan barcha ustunlarni tanlash:', options: ['SELECT ALL', 'SELECT *', 'GET *', 'SELECT columns'], correct: [1] },
    { text: 'Ikkala jadvalda mos keladigan qatorlarni qaytaruvchi JOIN:', options: ['LEFT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN'], correct: [1] },
    { text: 'ACID xossalariga kiradi:', options: ['Atomicity', 'Consistency', 'Availability', 'Durability'], correct: [0, 1, 3], type: 'multiple' },
    { text: 'PRIMARY KEY qiymati NULL bo‘lishi mumkin.', options: ["To'g'ri", "Noto'g'ri"], correct: [1], type: 'truefalse' },
    { text: 'Guruhlangan natijani filtrlash uchun:', options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], correct: [1] },
    { text: 'Indeks asosan nimani tezlashtiradi?', options: ['INSERT', 'Qidiruv (SELECT)', 'DROP', 'Zaxira nusxa'], correct: [1] },
  ],
  net: [
    { text: 'OSI modelida nechta sath bor?', options: ['4', '5', '7', '9'], correct: [2] },
    { text: 'DNS nima vazifani bajaradi?', options: ['IP manzil berish', 'Domen nomini IP’ga aylantirish', 'Shifrlash', 'Marshrutlash'], correct: [1] },
    { text: 'Ishonchli yetkazib berishni ta’minlovchi protokol:', options: ['UDP', 'TCP', 'ICMP', 'ARP'], correct: [1] },
    { text: '192.168.0.0/24 tarmog‘ida nechta foydali host bor?', options: ['254', '256', '255', '128'], correct: [0] },
    { text: 'HTTPS standart porti 443.', options: ["To'g'ri", "Noto'g'ri"], correct: [0], type: 'truefalse' },
    { text: 'Transport sathi protokollari:', options: ['TCP', 'IP', 'UDP', 'Ethernet'], correct: [0, 2], type: 'multiple' },
  ],
  math: [
    { text: 'f(x) = x² funksiyaning hosilasi:', options: ['x', '2x', 'x²/2', '2'], correct: [1] },
    { text: '2×2 birlik matritsaning determinanti:', options: ['0', '1', '2', '4'], correct: [1] },
    { text: '∫ 2x dx = ?', options: ['x² + C', '2x² + C', 'x + C', '2 + C'], correct: [0] },
    { text: 'lim (x→0) sin(x)/x = 1', options: ["To'g'ri", "Noto'g'ri"], correct: [0], type: 'truefalse' },
    { text: 'Vektorlarning skalyar ko‘paytmasi nol bo‘lsa, ular:', options: ['Parallel', 'Perpendikulyar', 'Teng', 'Qarama-qarshi'], correct: [1] },
    { text: 'e sonining taqribiy qiymati:', options: ['2.71', '3.14', '1.61', '1.41'], correct: [0] },
  ],
  ux: [
    { text: 'Persona nima?', options: ['Dizayner rezyumesi', 'Maqsadli foydalanuvchining umumlashgan obrazi', 'Rang palitrasi', 'Prototip turi'], correct: [1] },
    { text: 'Past aniqlikdagi (lo-fi) maket:', options: ['Wireframe', 'Mockup', 'Final UI', 'Brandbook'], correct: [0] },
    { text: 'Figma’da moslashuvchan joylashuv uchun:', options: ['Auto layout', 'Masking', 'Boolean', 'Blend'], correct: [0] },
    { text: 'Kontrast WCAG AA uchun oddiy matnda kamida 4.5:1 bo‘lishi kerak.', options: ["To'g'ri", "Noto'g'ri"], correct: [0], type: 'truefalse' },
    { text: 'Usability testning maqsadi:', options: ['Rang tanlash', 'Foydalanuvchi muammolarini aniqlash', 'Kod yozish', 'Marketing'], correct: [1] },
  ],
  ai: [
    { text: 'Nazoratli o‘qitish (supervised) misoli:', options: ['K-means', 'Chiziqli regressiya', 'PCA', 'Apriori'], correct: [1] },
    { text: 'Overfitting nima?', options: ['Model juda sodda', 'Model train ma’lumotiga haddan ortiq moslashgan', 'Ma’lumot yetishmasligi', 'Tez o‘qitish'], correct: [1] },
    { text: 'Transformer arxitekturasining asosiy mexanizmi:', options: ['Konvolyutsiya', 'Attention', 'Pooling', 'Dropout'], correct: [1] },
    { text: 'Klassifikatsiya metrikalari:', options: ['Accuracy', 'F1-score', 'MSE', 'Precision'], correct: [0, 1, 3], type: 'multiple' },
    { text: 'K-means klasterlash nazoratsiz o‘qitish usuli.', options: ["To'g'ri", "Noto'g'ri"], correct: [0], type: 'truefalse' },
  ],
  generic: [
    { text: 'Bitta baytda nechta bit bor?', options: ['4', '8', '16', '32'], correct: [1] },
    { text: 'Git’da o‘zgarishlarni saqlash buyrug‘i:', options: ['git push', 'git commit', 'git pull', 'git clone'], correct: [1] },
    { text: 'Ikkilik sanoq tizimida 1010 = ?', options: ['8', '10', '12', '5'], correct: [1] },
    { text: 'RAM energiya o‘chganda ma’lumotni saqlaydi.', options: ["To'g'ri", "Noto'g'ri"], correct: [1], type: 'truefalse' },
    { text: 'Ochiq kodli operatsion tizimlar:', options: ['Linux', 'Windows', 'FreeBSD', 'macOS'], correct: [0, 2], type: 'multiple' },
    { text: 'HTML nima?', options: ['Dasturlash tili', 'Belgilash tili', 'Ma’lumotlar bazasi', 'Protokol'], correct: [1] },
    { text: '1 KB taxminan necha baytga teng?', options: ['100', '1000 (1024)', '10 000', '1 000 000'], correct: [1] },
  ],
};

export const ADMIN_ACTIVITY = [
  { text: "DI-301 guruhi uchun dars jadvali yangilandi", kind: 'schedule' },
  { text: "Yangi fan qo'shildi: Kriptografiya asoslari", kind: 'subject' },
  { text: '2026-2027 o‘quv yili 1-semestri faollashtirildi', kind: 'year' },
  { text: "12 ta yangi talaba ro'yxatdan o'tdi", kind: 'user' },
  { text: "Oraliq nazorat natijalari e'lon qilindi (KI-201)", kind: 'grade' },
  { text: "Tizim zaxira nusxasi muvaffaqiyatli yaratildi", kind: 'system' },
];
