export interface TestimonialEntry {
  id: string;
  name: string;
  initials: string;
  role: string;
  flat: string;
  society: string;
  rating: number;
  quote: string;
  sample: boolean; // Must be marked true for sample/demo testimonials
}

export const testimonialsContent: {
  tag: string;
  heading: string;
  subtitle: string;
  items: TestimonialEntry[];
} = {
  tag: 'RESIDENT & COMMITTEE VOICES',
  heading: 'What Residents & Leaders Say',
  subtitle: 'Real feedback from communities that swapped messy chat groups for GrievEase.',
  items: [
    {
      id: 't-1',
      name: 'Priya Sharma',
      initials: 'PS',
      role: 'Resident',
      flat: 'Flat B-402',
      society: 'Green Valley Residency',
      rating: 5,
      quote:
        'Finally a platform that actually holds the committee accountable. My water leakage complaint was auto-escalated to Level 2 and resolved in under 38 hours. Remarkable peace of mind.',
      sample: true,
    },
    {
      id: 't-2',
      name: 'Sanjay Kumar',
      initials: 'SK',
      role: 'Secretary',
      flat: 'Tower 1',
      society: 'Green Valley Residency',
      rating: 5,
      quote:
        'As Secretary, the resolver inbox prioritises complaints by SLA urgency so nothing slips through the cracks. The automated assignment to maintenance staff has cut my phone calls by 80%.',
      sample: true,
    },
    {
      id: 't-3',
      name: 'Deepa Mehta',
      initials: 'DM',
      role: 'Committee Member',
      flat: 'Wing A',
      society: 'Palm Grove Society',
      rating: 5,
      quote:
        'The public transparency dashboard completely eliminated arguments at our annual general meeting. Residents can see resolution times and vendor performance in clear, unbiased charts.',
      sample: true,
    },
    {
      id: 't-4',
      name: 'Col. R. K. Nair (Retd.)',
      initials: 'RN',
      role: 'Chairman',
      flat: 'Block C',
      society: 'Silver Oak Enclave',
      rating: 5,
      quote:
        'The 4-level escalation framework provides the exact discipline needed in a 600-apartment society. Chairman override is rarely needed because L1 and L2 resolve issues before SLA expiry.',
      sample: true,
    },
    {
      id: 't-5',
      name: 'Ananya Joshi',
      initials: 'AJ',
      role: 'Resident',
      flat: 'D-1104',
      society: 'Skyline Heights',
      rating: 5,
      quote:
        'Being able to file an anonymous complaint regarding corridor noise without fear of awkward neighbor encounters was a game changer for our building harmony.',
      sample: true,
    },
  ],
};
