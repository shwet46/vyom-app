"""Culturally vetted, deterministic fallback message templates for all scenarios."""

from __future__ import annotations


class FallbackTemplates:
    """Pre-approved templates guaranteed to comply with tone guardrails and zero hallucination."""

    @staticmethod
    def winback(merchant_name: str, customer_name: str, tone_profile: str = "festive") -> dict[str, str]:
        if tone_profile == "solemn":
            return {
                "en": f"Namaste {customer_name}, {merchant_name} hopes your family is well. We have pure Shradh and puja essentials in stock whenever you need them.",
                "hi": f"नमस्ते {customer_name}, {merchant_name} की ओर से प्रणाम। श्राद्ध एवं पूजा की शुद्ध सामग्री दुकान पर उपलब्ध है।",
                "mr": f"नमस्कार {customer_name}, {merchant_name} कडून सस्नेह नमस्कार। श्राद्ध आणि पूजेचे शुद्ध साहित्य दुकानात उपलब्ध आहे।",
                "hinglish": f"Namaste {customer_name}! {merchant_name} par pure Shradh aur puja ka samaan ready hai. Koi bhi zaroorat ho toh batayein.",
            }

        return {
            "en": f"Hello {customer_name}! We missed you at {merchant_name}. Visit us this week for fresh stock and personal service.",
            "hi": f"नमस्ते {customer_name}! {merchant_name} में काफी समय से आपका आगमन नहीं हुआ। इस सप्ताह आपके लिए ताज़ा सामान उपलब्ध है।",
            "mr": f"नमस्कार {customer_name}! {merchant_name} मध्ये बऱ्याच दिवसांत आला नाहीत। या आठवड्यात ताजे किराणा साहित्य उपलब्ध आहे।",
            "hinglish": f"Namaste {customer_name}! Kaafi din se aap {merchant_name} nahi aaye. Is hafte fresh grocery stock par special offers uplabdh hain.",
        }

    @staticmethod
    def festival_kit(
        merchant_name: str,
        festival_name: str,
        kit_name: str,
        price_rupees: float,
    ) -> dict[str, str]:
        return {
            "en": f"Pre-order your {festival_name} {kit_name} from {merchant_name} for ₹{price_rupees:.0f}. 100% pure and handpicked ingredients.",
            "hi": f"{merchant_name} से {festival_name} {kit_name} केवल ₹{price_rupees:.0f} में बुक करें। शुद्ध और प्रामाणिक सामग्री।",
            "mr": f"{merchant_name} मधून {festival_name} {kit_name} फक्त ₹{price_rupees:.0f} मध्ये बुक करा। १००% शुद्ध साहित्य।",
            "hinglish": f"{merchant_name} par {festival_name} {kit_name} pre-order karein sirf ₹{price_rupees:.0f} mein. Pure aur verified samaan!",
        }

    @staticmethod
    def udhaar_reminder(
        customer_name: str,
        amount_rupees: float,
        tone: str = "gentle",
    ) -> dict[str, str]:
        if tone == "gentle":
            return {
                "en": f"Namaste {customer_name}, a friendly reminder regarding your pending balance of ₹{amount_rupees:.0f}. Thank you!",
                "hi": f"नमस्ते {customer_name}, आपके ₹{amount_rupees:.0f} के बकाया हिसाब की एक विनम्र याद-दहानी। धन्यवाद!",
                "mr": f"नमस्कार {customer_name}, आपल्या ₹{amount_rupees:.0f} च्या उधारी हिशोबाची नम्र आठवण। धन्यवाद!",
                "hinglish": f"Namaste {customer_name}, aapke ₹{amount_rupees:.0f} ke hisaab ki ek gentle yaad-dehani. Samay nikal kar bhuqtan karein.",
            }
        elif tone == "polite_firm":
            return {
                "en": f"Namaste {customer_name}, your balance of ₹{amount_rupees:.0f} is overdue. Please settle via UPI when convenient.",
                "hi": f"नमस्ते {customer_name}, आपका ₹{amount_rupees:.0f} का उधार ड्यू हो चुका है। कृपया सुविधा अनुसार UPI द्वारा भुगतान करें।",
                "mr": f"नमस्कार {customer_name}, आपले ₹{amount_rupees:.0f} चे देणे ड्यू झाले आहे। कृपया सोयीनुसार UPI ने क्लिअर करावे।",
                "hinglish": f"Namaste {customer_name}, aapka ₹{amount_rupees:.0f} ka udhaar due ho chuka hai. Kripya UPI pay link se clear karein.",
            }
        else:
            return {
                "en": f"Namaste {customer_name}, your balance of ₹{amount_rupees:.0f} has been pending for over 3 weeks. Please clear it today.",
                "hi": f"नमस्ते {customer_name}, आपका ₹{amount_rupees:.0f} का हिसाब काफी समय से रुका है। कृपया आज ही इसका भुगतान करें।",
                "mr": f"नमस्कार {customer_name}, आपले ₹{amount_rupees:.0f} चे देणे बरेच दिवस झाले प्रलंबित आहे। कृपया आजच क्लिअर करावे।",
                "hinglish": f"Namaste {customer_name}, aapka ₹{amount_rupees:.0f} ka hisaab 3 hafte se baaki hai. Kripya aaj hi clear karein.",
            }
