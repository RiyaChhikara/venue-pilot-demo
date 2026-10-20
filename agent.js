(function (root) {
  const CONTACT = '020 7307 2474 or venue@11cavendishsq.com';
  const NO11 = 'No.11 Cavendish Square';

  function countGuests(text) {
    const patterns = [
      /\b(?:about|around|approximately|approx\.?|for)\s+(\d{1,3})\s+(?:guests|people|of us|attendees)\b/i,
      /\b(\d{1,3})\s+(?:guests|people|of us|attendees)\b/i,
      /\bguest(?:s)?\s*[:=]\s*(\d{1,3})\b/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function includesAny(text, terms) {
    return terms.some((term) => text.includes(term));
  }

  function getRoom(text) {
    if (includesAny(text, ['orangery'])) return 'Orangery & Courtyard Garden';
    if (includesAny(text, ['garden room'])) return 'Garden Room';
    if (includesAny(text, ['burdett'])) return 'Burdett Suite';
    if (includesAny(text, ['president'])) return 'President’s Room';
    return null;
  }

  function getLayout(text) {
    if (includesAny(text, ['ceremony', 'civil ceremony', 'vows', 'registry'])) return 'ceremony';
    if (includesAny(text, ['wedding breakfast', 'dinner', 'seated meal', 'sit-down'])) return 'dinner';
    if (includesAny(text, ['reception', 'evening party', 'standing'])) return 'reception';
    return null;
  }

  function scoreAndMissing(text, guests, room, layout) {
    const hasDate = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}[/-]\d{1,2})\b/i.test(text) || /\b20\d{2}\b/.test(text);
    const hasBudget = /£\s?\d|\b(?:budget|spend|price|cost|per person)\b/i.test(text);
    const hasPurpose = includesAny(text, ['ceremony', 'reception', 'wedding breakfast', 'dinner', 'civil', 'vows']);
    const missing = [];
    if (!hasDate) missing.push('Preferred date');
    if (guests === null) missing.push('Approximate guest count');
    if (!room) missing.push('Preferred room or space');
    if (!hasPurpose) missing.push('Ceremony, wedding breakfast or reception plans');
    if (!hasBudget) missing.push('Budget or package preference');
    const score = [hasDate, guests !== null, !!room, hasPurpose, hasBudget].filter(Boolean).length;
    return { score, missing };
  }

  function analyze(raw) {
    const text = String(raw || '').trim();
    const lower = text.toLowerCase();
    const guests = countGuests(lower);
    const room = getRoom(lower);
    const layout = getLayout(lower);
    const { score, missing } = scoreAndMissing(lower, guests, room, layout);
    const reasons = [];
    const paragraphs = ['Thanks for getting in touch, and congratulations to you both.'];
    const sources = new Set(['No.11 wedding brochure 2026', 'No.11 official website FAQ']);

    const asksAvailability = includesAny(lower, ['available', 'availability', 'free on', 'open on', 'date work', 'date is free', 'hold the date']);
    const asksViewing = includesAny(lower, ['viewing', 'tour', 'come see', 'visit the venue', 'see the room']);
    const asksPrice = includesAny(lower, ['price', 'cost', 'budget', 'quote', 'package', 'per person', 'how much']);
    const asksCeremonyOnly = includesAny(lower, ['civil ceremony', 'ceremony only', 'ceremony-only', 'just the ceremony', 'registry office']);
    const asksLGBTQ = includesAny(lower, ['same-sex', 'same sex', 'gay couple', 'lesbian', 'lgbtq', 'queer', 'two grooms', 'two brides']);
    const asksAccess = includesAny(lower, ['wheelchair', 'step-free', 'step free', 'accessible', 'accessibility', 'mobility', 'hearing loop', 'disabled']);
    const asksDietary = includesAny(lower, ['dietary', 'allerg', 'coeliac', 'celiac', 'gluten-free', 'gluten free', 'vegan', 'halal', 'kosher', 'nut-free', 'nut free']);
    const asksOutsideCaterer = includesAny(lower, ['external cater', 'outside cater', 'bring our own cater', 'dry hire']);
    const asksAccommodation = includesAny(lower, ['accommodation', 'hotel', 'overnight', 'stay nearby', 'rooms for guests']);
    const asksCancellation = includesAny(lower, ['cancel', 'cancellation', 'refund', 'deposit', 'contract']);
    const asksAccessibilityException = asksAccess;
    const asksUnder18 = includesAny(lower, ['under 18', 'children', 'child', 'kids', 'babies', 'baby']);
    const asksPet = includesAny(lower, ['dog', 'pet', 'assistance animal']);
    const asksFriday = includesAny(lower, ['friday']);
    const asksSaturday = includesAny(lower, ['saturday']);
    const asksSunday = includesAny(lower, ['sunday']);
    const dateTerms = text.match(/\b(?:\d{1,2}\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{1,2})?(?:,?\s+20\d{2})?\b|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/i);

    if (!text) {
      return { draft: 'Paste a couple’s enquiry to create a draft reply.', score: 0, missing: ['Enquiry text'], reasons: [], sources: [] };
    }

    if (asksAvailability) {
      paragraphs.push(`The team checks date availability directly, so I can’t confirm whether ${dateTerms ? `your preferred date (${dateTerms[0]})` : 'your preferred date'} is free from this demo. Please contact ${CONTACT} and they can check the diary.`);
      reasons.push('Date availability is not public or connected to this demo.');
    }

    if (room && guests !== null) {
      const capacities = {
        'Orangery & Courtyard Garden': { ceremony: 144, dinner: 140, reception: 280 },
        'Garden Room': { ceremony: 100, reception: 100 },
        'Burdett Suite': { ceremony: 200, dinner: 240, reception: 300 }
      };
      const limit = capacities[room] && capacities[room][layout];
      const layoutLabel = layout === 'dinner' ? 'wedding breakfast' : layout;
      if (room === 'Garden Room' && layout === 'dinner') {
        const aboveGeneralLimit = guests > 50;
        paragraphs.push(`The Garden Room event-space page lists 50 for lunch or dinner, but the wedding brochure does not give a Garden Room wedding-breakfast layout. ${aboveGeneralLimit ? `Your estimate of ${guests} is above the general dinner figure. ` : ''}The venue team should confirm the wedding setup for your guest count.`);
        reasons.push('The Garden Room wedding-breakfast capacity is not stated in the brochure; the 50-person figure is for general lunch/dinner use.');
      } else if (limit && guests > limit) {
        paragraphs.push(`For ${room}, the 2026 brochure lists up to ${limit} guests for a ${layoutLabel}. Your estimate of ${guests} is above that published layout figure, so the venue team should confirm whether another room or layout could work.`);
        reasons.push(`${guests} guests is above the published ${room} ${layoutLabel} capacity of ${limit}.`);
      } else if (limit) {
        paragraphs.push(`The 2026 brochure lists ${room} for up to ${limit} guests for a ${layoutLabel}. The team should confirm the right setup for your plans.`);
      } else if (room === 'President’s Room') {
        paragraphs.push(`The event-space page gives a general capacity of 5–24 for the President’s Suite, but does not publish a wedding layout capacity. ${guests > 24 ? `Your estimate of ${guests} is over that general event capacity. ` : ''}The venue team should confirm whether your guest count and plans fit.`);
        reasons.push('The President’s Suite has no published wedding-layout capacity in the reviewed sources.');
      }
    } else if (guests !== null && layout) {
      const generalCaps = { ceremony: 200, dinner: 240, reception: 300 };
      const limit = generalCaps[layout];
      const layoutLabel = layout === 'dinner' ? 'dinners' : `${layout}s`;
      if (limit && guests > limit) {
        paragraphs.push(`The official FAQ lists up to ${limit} guests for ${layoutLabel} venue-wide. Your estimate of ${guests} is above that published maximum and needs a direct conversation with the team.`);
        reasons.push(`The guest estimate exceeds the published venue-wide ${layoutLabel} maximum of ${limit}.`);
      }
    }

    if (asksPrice && !asksCeremonyOnly) {
      sources.add('No.11 Garden Room page');
      let priceText = 'The 2026 brochure lists the Classic wedding package at £165 + VAT per person for 100–150 guests, and £155 + VAT per person for more than 150 guests. The current Garden Room page says packages from £155 + VAT with minimum numbers of 100. Because those published starting prices differ, the team needs to confirm the current quote for your date, room and guest count.';
      if (asksFriday) {
        priceText += ' The brochure says wedding packages are available on Saturdays and Sundays; it does not list a Friday wedding-package rate.';
        reasons.push('The sources do not state a Friday wedding-package rate.');
      } else if (asksSaturday || asksSunday) {
        priceText += ` The brochure lists wedding packages for ${asksSaturday ? 'Saturdays' : 'Sundays'}; the team should confirm the current package and date.`;
      }
      if (guests !== null && guests < 100) {
        priceText += ' The published Garden Room page gives a 100-person minimum, so the team should advise whether another option is available for your guest count.';
        reasons.push('The published package minimum is 100 guests; the enquiry is below that number.');
      }
      paragraphs.push(priceText);
      reasons.push('The published package prices need confirmation before a quote.');
    } else if (asksFriday && (asksSaturday || asksSunday)) {
      paragraphs.push('The 2026 brochure says wedding packages are available on Saturdays and Sundays. It does not list a Friday wedding-package rate, so the team should confirm Friday options directly.');
      reasons.push('The sources do not state a Friday wedding-package rate.');
    }

    if (asksCeremonyOnly) {
      paragraphs.push('The 2026 brochure says No.11 is licensed for ceremonies with up to 200 guests in three spaces. It does not set out a ceremony-only package or price, so the team will need to advise on the format and cost.');
      reasons.push('Ceremony-only pricing and arrangements are not published in the reviewed sources.');
    }

    if (asksLGBTQ) {
      paragraphs.push('The public information used for this demo does not answer that specific policy question. I’ll flag it for the venue team to confirm directly, and I’ll keep the wording and planning questions inclusive of you both.');
      reasons.push('The requested inclusivity policy is not stated in the reviewed sources.');
    }

    if (asksDietary) {
      paragraphs.push('The FAQ says Searcys is the contract caterer and that its in-house team can adjust menus. It asks for dietary requests with the final event details. Please share the specific requirements; the team must confirm the specific allergy or cross-contamination arrangements.');
      reasons.push('A person should confirm the specific dietary or allergy arrangements.');
    }

    if (asksOutsideCaterer) {
      paragraphs.push('The official FAQ says external caterers are not allowed; Searcys is the contract caterer. If you have a special request, the venue team would need to discuss it with you.');
      reasons.push('The requested external-catering exception needs a human response.');
    }

    if (asksAccess) {
      paragraphs.push('The FAQ describes No.11 as fully accessible and AIM gold-accredited. It does not detail the specific arrangement you asked about, so the team should confirm it for your needs before you plan a visit.');
      reasons.push('The requested access detail is not specified in the public information.');
    }

    if (asksAccommodation) {
      paragraphs.push('I couldn’t find on-site wedding accommodation information in the public sources used for this demo. The team can confirm any arrangements or recommendations.');
      reasons.push('Accommodation information is not published in the reviewed sources.');
    }

    if (asksCancellation) {
      paragraphs.push('The FAQ outlines a provisional contract, a room-hire deposit and cancellation charges that vary by timing. Because cancellation terms depend on the contract and dates, the venue team should explain the applicable terms directly.');
      reasons.push('Booking, deposit or cancellation terms need a human explanation.');
    }

    if (asksUnder18) {
      paragraphs.push('The FAQ currently says all guests must be over 18. Please ask the venue team to confirm how that applies to your plans before making arrangements.');
      reasons.push('The published age restriction affects this enquiry and should be confirmed by the team.');
    }

    if (asksPet) {
      paragraphs.push('The FAQ says only guide dogs are allowed in the event spaces. If you mean an assistance animal or need to discuss an exception, the team should confirm the policy directly.');
      reasons.push('The animal policy needs confirmation for this request.');
    }

    if (asksViewing) {
      paragraphs.push(`The brochure says viewings can be arranged with an event manager. Please contact ${CONTACT} with a couple of dates that suit you; this demo can’t see or reserve viewing slots.`);
      reasons.push('Viewing dates and times are not connected to this demo.');
    }

    if (reasons.length === 0 && !asksAvailability && !asksPrice && !asksCeremonyOnly && !asksLGBTQ && !asksDietary && !asksOutsideCaterer && !asksAccess && !asksAccommodation && !asksCancellation && !asksUnder18 && !asksPet && !asksViewing && !(room && guests !== null && layout)) {
      paragraphs.push('The team can help shape the next step. If you share your preferred date, approximate guest count, preferred room or space, ceremony, wedding breakfast or reception plans, and budget or package preference, they can point you to the most relevant option.');
    } else if (missing.length) {
      paragraphs.push(`To help the team take this further, please share: ${missing.join(', ')}.`);
    }

    if (asksFriday || asksSaturday || asksSunday) sources.add('No.11 2026 wedding brochure');
    if (asksDietary || asksOutsideCaterer || asksAccommodation || asksCancellation || asksUnder18 || asksPet || asksAccess || asksAvailability) sources.add('No.11 official website FAQ');
    if (asksViewing) sources.add('No.11 2026 wedding brochure');

    const needsHuman = reasons.length > 0;
    const nextStep = asksAvailability || asksViewing ? `Contact ${CONTACT}` : (missing.length ? `Ask for ${missing.slice(0, 3).join(', ').toLowerCase()}` : 'Venue team to review before sending');
    const draft = `${paragraphs.join('\n\n')}\n\nBest wishes,\nThe No.11 weddings team`;
    return { draft, score, missing, reasons, needsHuman, nextStep, sources: [...sources] };
  }

  const api = { analyze, countGuests, getRoom, getLayout };
  root.VenuePilotAgent = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);