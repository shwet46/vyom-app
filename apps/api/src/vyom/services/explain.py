"""Merchant explanation generator rewriting detected opportunity evidence into clear, transparent copy."""

from __future__ import annotations

from pydantic import BaseModel

from vyom.models.opportunity import Opportunity


class OpportunityExplanation(BaseModel):
    """2-3 line plain-language explanation of why this opportunity was surfaced."""

    en: str
    hi: str
    hinglish: str
    audio_script: str


class OpportunityExplainer:
    """Generates concise, factual merchant explanations from stored evidence."""

    @staticmethod
    def explain(opportunity: Opportunity) -> OpportunityExplanation:
        ev = opportunity.evidence
        opp_type = opportunity.type.value

        if opp_type == "winback":
            count = ev.churned_customers_count
            en = (
                f"We noticed {count} of your regular customers have stopped visiting. "
                f"Sending a friendly check-in can bring back an estimated ₹{opportunity.est_return_paise / 100:.0f} in sales."
            )
            hi = (
                f"हमने देखा कि आपके {count} नियमित ग्राहकों ने आना बंद कर दिया है। "
                f"एक संदेश भेजकर लगभग ₹{opportunity.est_return_paise / 100:.0f} की बिक्री वापस मिल सकती है।"
            )
            hinglish = (
                f"Aapke {count} regular customers ka visit gap double ho gaya hai. "
                f"Ek winback offer bhej kar approx ₹{opportunity.est_return_paise / 100:.0f} recover ho sakte hain."
            )
            audio = hinglish

        elif opp_type == "dead_hour":
            slot = ev.dead_hour_slot or "afternoon"
            en = (
                f"Sales typically slow down during {slot}. "
                "A limited-time afternoon offer can drive footfall and boost daily turnover."
            )
            hi = (
                f"{slot} के दौरान दुकान में ग्राहक कम होते हैं। "
                "एक छोटा ऑफर भेजकर दोपहर की बिक्री बढ़ाई जा सकती है।"
            )
            hinglish = (
                f"{slot} ke waqt dukan thodi shaant rehti hai. "
                "Ek quick happy-hour offer se extra bikri nikal sakti hai."
            )
            audio = hinglish

        elif opp_type == "festival_kit":
            fest = ev.festival_name or "Festival"
            days = ev.days_to_festival or 7
            en = (
                f"{fest} starts in {days} days. Families will soon purchase puja and fasting essentials. "
                "Offering pre-packed kits saves their time and guarantees your sales."
            )
            hi = (
                f"{fest} {days} दिनों में शुरू हो रहा है। ग्राहक पूजा और व्रत का सामान खरीदेंगे। "
                "तैयार किट की पेशकश करके आप अपनी बिक्री सुनिश्चित कर सकते हैं।"
            )
            hinglish = (
                f"{fest} agle {days} dino mein shuru ho raha hai. "
                "Vrat aur puja ki ready kit offer karke aap advance booking le sakte hain."
            )
            audio = hinglish

        elif opp_type == "festival_stockup":
            fest = ev.festival_name or "Festival"
            en = (
                f"High local demand expected for {fest} fasting and ritual items. "
                "Review stock recommendations now to avoid last-minute stockouts."
            )
            hi = (
                f"{fest} के दौरान उपवास और पूजा सामग्री की भारी मांग रहेगी। "
                "सामान खत्म होने से बचने के लिए अभी स्टॉक की समीक्षा करें।"
            )
            hinglish = (
                f"{fest} ke liye items ki demand badhne wali hai. "
                "Stock recommendations check karke pehle se samaan manga lijiye."
            )
            audio = hinglish

        elif opp_type == "post_festival_clearance":
            fest = ev.festival_name or "Festival"
            en = (
                f"{fest} has ended. Clear out remaining festival supplies and special sweets ingredients "
                "to free up cash and shelf space."
            )
            hi = (
                f"{fest} समाप्त हो गया है। बची हुई त्यौहारी सामग्री और जल्दी खराब होने वाले सामान को "
                "जल्दी निकालने के लिए विशेष छूट दें।"
            )
            hinglish = (
                f"{fest} khatam hone ke baad bacha hua festival stock jaldi clear karne ke liye "
                "ek clearance offer run karna faydemand rahega."
            )
            audio = hinglish

        else:
            en = ev.reason or "Action recommended based on recent store analytics."
            hi = "दुकान के हालिया आंकड़ों के आधार पर यह सुझाव दिया गया है।"
            hinglish = (
                "Store data aur seasonal trends ke hisab se ye suggestion ready kiya gaya hai."
            )
            audio = hinglish

        return OpportunityExplanation(
            en=en,
            hi=hi,
            hinglish=hinglish,
            audio_script=audio,
        )
