<div dir="rtl">

# فلوچارت‌های تشخیصی: کوکسی گرم منفی

## فلوچارت ۱: از دیپلوکوک گرم منفی تا گونه

```mermaid
flowchart TD
A[دیپلوکوک یا کوکوباسیل گرم منفی<br/>روی شکلات یا MTM] --> B{اکسیداز}
B -->|منفی| B1[Acinetobacter و سایر<br/>ماژول 19]
B -->|مثبت| C{کاتالاز}
C -->|منفی| C1[Kingella یا N. elongata<br/>MALDI-TOF]
C -->|مثبت| D{بوتیرات استراز و DNase}
D -->|هر دو مثبت| D1[M. catarrhalis<br/>نیترات +، همهٔ قندها منفی<br/>نیتروسفین]
D -->|منفی| E{قندها یا MALDI-TOF}
E -->|فقط گلوکز| F{کولیستین 10µg و رشد روی آگار مغذی}
F -->|کولیستین R، بدون رشد| F1[N. gonorrhoeae<br/>PRO +]
F -->|کولیستین S، رشد| F2[N. cinerea]
E -->|گلوکز و مالتوز| G{GGT و پلی‌ساکارید از ساکارز}
G -->|GGT + ، پلی‌ساکارید −| G1[N. meningitidis<br/>BSC، سروگروه، اطلاع فوری]
G -->|GGT − ، پلی‌ساکارید +| G2[N. polysaccharea]
E -->|گلوکز، مالتوز، لاکتوز| H[N. lactamica<br/>ONPG +]
E -->|گلوکز، مالتوز، ساکارز| I[N. sicca / N. mucosa / N. subflava<br/>همسفره]
E -->|هیچ‌کدام| J[N. cinerea یا N. flavescens<br/>بازبینی بوتیرات]
```

### منطق شاخه‌ها
- **اکسیداز و کاتالاز اول:** دو شبیه مهم (*Acinetobacter* اکسیداز −؛ *Kingella* کاتالاز −) در همین دو گام حذف می‌شوند.
- **بوتیرات + DNase** سریع‌ترین راه شناسایی *M. catarrhalis* است (۵ دقیقه).
- **«فقط گلوکز» کافی نیست:** همیشه **کولیستین** و **رشد روی آگار مغذی** (یا MALDI-TOF) را اضافه کنید تا *N. cinerea* حذف شود.
- **مننگوکوکوس:** GGT تنها آنزیم اختصاصی است؛ *N. polysaccharea* روی محیط انتخابی رشد می‌کند و الگوی قندی یکسان دارد.

## فلوچارت ۲: تشخیص گونوکوکوس بر اساس نوع نمونه

```mermaid
flowchart TD
A[شک به گنوره] --> B{بیمار و نمونه}
B -->|مرد علامت‌دار، ترشح مجرا| C[رنگ گرم ترشح]
C -->|دیپلوکوک گرم منفی داخل PMN| C1[گزارش احتمالی گنوره<br/>حساسیت و ویژگی بالا]
C -->|منفی| D[NAAT ادرار اول جریان]
B -->|زن| E[NAAT سواب واژن<br/>رنگ گرم سرویکس قابل اعتماد نیست]
B -->|رکتوم یا حلق| F[NAAT تأییدشده برای این محل]
B -->|کودک یا پرونده قانونی| G[کشت روی MTM و شکلات<br/>نگهداری جدایه]
G --> G1[تأیید با دو روش مستقل<br/>MALDI-TOF و قند یا NAAT دوم]
B -->|شکست درمان یا پایش مقاومت| H[کشت پیش از درمان مجدد<br/>AST سفتریاکسون]
B -->|DGI: مفصل، خون، پوست| I[کشت مایع مفصلی و خون<br/>به‌علاوهٔ NAAT محل‌های مخاطی]
```

**تصاویر:**

<table><tr><td align="center" width="50%"><img src="Assets/images/gonococcus-two-media.jpg" width="300" alt="gonococcus-two-media"><br><sub><b>شکل ۱۶.۰۶.</b> نمونهٔ رکتوم برای <i>N. gonorrhoeae</i>: رشد بیش از حد فلور نرمال روی آگار شکلات (چپ) در برابر رشد فقط <i>Neisseria</i> روی محیط Thayer-Martin (راست)<br>منبع: Wikimedia Commons، <a href="https://commons.wikimedia.org/wiki/File:Neisseria_gonorrhoeae_01.png">Wikimedia Commons</a>، Public domain</sub></td><td align="center" width="50%"><img src="Assets/images/gram-gonococcus-vaginal-swab.jpg" width="300" alt="gram-gonococcus-vaginal-swab"><br><sub><b>شکل ۱۶.۰۷.</b> رنگ گرم سواب واژن: گونوکوکوس‌های جفتی داخل PMN (پیکان)<br>منبع: Graham Beards، <a href="https://commons.wikimedia.org/wiki/File:Neisseria_gonorrhoeae_and_pus_cells_in_a_vaginal_swab_(Gram_stain).jpg">Wikimedia Commons</a>، <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a></sub></td></tr></table>

## فلوچارت ۳: دیپلوکوک گرم منفی در CSF یا خون

```mermaid
flowchart TD
A[دیپلوکوک گرم منفی در CSF یا بطری خون] --> B[اطلاع فوری به پزشک<br/>مقدار بحرانی]
B --> C[همهٔ کار با کلنی در BSC]
C --> D[شکلات و آگار خون، CO2]
D --> E{اکسیداز و MALDI-TOF یا قندها}
E -->|N. meningitidis| F[سروگروه یا PCR<br/>ارسال جدایه به آزمایشگاه مرجع]
F --> F1[اطلاع به بهداشت<br/>پروفیلاکسی تماس‌ها]
E -->|M. catarrhalis یا Neisseria همسفره| G[تفسیر با بالین<br/>تکرار کشت]
E -->|Acinetobacter| H[ماژول 19]
```

**تصاویر:**

<table><tr><td align="center" width="50%"><img src="Assets/images/gram-meningococcus-csf.jpg" width="300" alt="gram-meningococcus-csf"><br><sub><b>شکل ۱۶.۰۸.</b> رنگ گرم CSF (۱۰۰۰×): دیپلوکوک‌های گرم منفی همراه با PMN؛ از این نمونه <i>N. meningitidis</i> کشت شد<br>منبع: Microman12345، <a href="https://commons.wikimedia.org/wiki/File:Neisseria_meningitidis_CSF_Gram_1000.jpg">Wikimedia Commons</a>، <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a></sub></td></tr></table>

</div>
