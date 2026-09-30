# VYOM — Festival and Ritual Intelligence Engine

## 1. Principles
VYOM treats Indian festival and cultural knowledge as a first-class intelligence pillar. Festivals, fasts (vrat), ancestral rites (shradh), and regional customs dictate retail footfall, stock requirements, and acceptable commercial tone in kirana commerce.

The engine is **deterministic, rule-enforced, and culturally vetted**.

---

## 2. Phase Classification Model

Every festival transitions through distinct operational phases computed by `classify_phase`:

```
       lead_days          peak_start  peak_end        post_days
    ├──────────┤         ├──────┤    ├──────┤       ├──────────┤
    │   prep   │  active │      │peak│      │active │   post   │
────┼──────────┼─────────┼──────┼────┼──────┼───────┼──────────┼──
  start-lead  start     peak_s      peak_e         end       end+post
```

| Phase | Definition | Commercial Actions |
|---|---|---|
| `upcoming` | > `lead_days` but $\le 60$ days away | Long-term planning, category awareness |
| `prep` | `[start - lead_days, start)` | Pre-stocking advisory, pre-order festival kits, advance bookings |
| `active` | `[start, end]` | Real-time replenishment, customer fulfillment |
| `peak` | `[peak_start, peak_end]` | Peak footfall, zero promotions, pure throughput |
| `post` | `(end, end + post_days]` | Inventory clearance, perishable markdowns, merchant gratitude |

---

## 3. Demo Date Reference (30 September 2026)

On the demo date **30 Sep 2026**, the engine evaluates the Maharashtra / Pune regional calendar:

| Festival | Phase | Dates | Tone Profile | Notes |
|---|---|---|---|---|
| **Ganesh Chaturthi** | `post` | 16–25 Sep 2026 | `festive` | Concluded 5 days ago; explains normal post-festival sales dip |
| **Pitru Paksha** | `active` | 27 Sep – 10 Oct 2026 | `solemn` | Active; strictly no discounts or sales wording; Shraddha samagri convenience framing only |
| **Shardiya Navratri** | `prep` | 11–19 Oct 2026 | `observant` | Starts in 11 days; Vrat kit campaign & Ghatasthapana puja stock-up active |
| **Vijayadashami / Dussehra** | `upcoming` | 20 Oct 2026 | `festive` | Upcoming in 20 days |
| **Diwali Cluster** | `upcoming` | 5–10 Nov 2026 | `festive` | Upcoming in 36 days; Faral pre-stocking advisory |

---

## 4. Uplift Estimation Formula

Estimated category uplift blends the merchant's own previous year sales with culturally curated priors:

$$\text{own\_uplift} = \frac{\text{avg\_daily\_sales}(\text{last year festival window})}{\text{baseline\_avg\_daily\_sales}} - 1.0$$

$$\text{uplift} = w \cdot \text{own\_uplift} + (1 - w) \cdot \text{prior\_uplift}$$

$$w = \min\left(1.0, \frac{\text{history\_days}}{180}\right)$$

The UI transparently informs the merchant of the calculation basis:
- *`"Aapki last year ki bikri se"`* (when $w \ge 0.5$)
- *`"Typical festival estimate for Pune kiranas"`* (when $w < 0.5$)

---

## 5. Stock Advisor Formula

$$\text{expected\_units} = \text{baseline\_daily\_units} \times \text{uplift} \times \text{window\_days}$$

$$\text{suggested\_range} = [\lceil 0.90 \times \text{expected\_units} \rceil, \lceil 1.15 \times \text{expected\_units} \rceil]$$

$$\text{shortfall} = \max(0, \text{suggested\_max} - \text{current\_stock})$$

---

## 6. Tone and Cultural Sensitivity Guardrails

Code-enforced via `ToneValidator.validate(text, tone_profile, excluded_categories)`:

### `solemn` (Pitru Paksha, Shradh)
- **Banned Words**: *sale, dhamaka, offer, discount, loot, celebrate, party, carnival, flat 50%, best deal, सेल, धमाका, भारी छूट, लूट लो*.
- **Emojis**: Only Namaste (**🙏**) allowed. No party poppers, balloons, or cheers.
- **Framing**: Service and convenience only (*"Shraddha aur tarpan ki shuddh samagri ek jagah uplabdh hai"*).

### `observant` (Navratri, Fasting Days)
- **Rules**: Strict adherence to Vrat / Farali dietary rules.
- **Excluded**: Non-veg, eggs, alcohol, onion, garlic.
- **Allowed**: Sabudana, Sendha Namak, Singhara Atta, Rajgira, Makhana, Peanuts, Pure Ghee, Dairy.

### All Profiles
- **Prohibited**: Religious superiority claims or supernatural guarantees (*"100% punya guarantee"*, *"moksha prapti"*).
- **Prohibited**: Alcoholic beverages, meat, poultry, or egg depictions.
