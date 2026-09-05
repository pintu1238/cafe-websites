export const contentSlugs = ['about', 'contact', 'how-it-works', 'faqs', 'offers', 'support', 'partner', 'resources'] as const;
export type ContentSlug = typeof contentSlugs[number];

export type ContentSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type ContentPage = {
  slug: ContentSlug;
  eyebrow: string;
  title: string;
  intro: string;
  sections: ContentSection[];
};

const contentPages: Record<ContentSlug, ContentPage> = {
  about: {
    slug: 'about',
    eyebrow: 'About UniEats',
    title: 'Good food, made for campus life.',
    intro: 'UniEats brings approved campus cafeterias, fresh menus, and simple pickup ordering into one student-first experience.',
    sections: [
      { heading: 'Our promise', paragraphs: ['We help students discover dependable meals between classes without the friction of scattered menus and long queues.'] },
      { heading: 'Built for your day', paragraphs: ['From a quick breakfast to a late study-session snack, UniEats keeps campus food easy to find, easy to order, and easy to enjoy.'] },
    ],
  },
  contact: {
    slug: 'contact',
    eyebrow: 'Contact UniEats',
    title: 'We are here to help.',
    intro: 'Reach out when you need help with an order, a cafeteria partnership, or the UniEats platform.',
    sections: [
      { heading: 'Support desk', paragraphs: ['Email support@unieats.in or call +91 62849 29772 for help with your account and orders.'] },
      { heading: 'Campus office', paragraphs: ['GNA University, Phagwara, Punjab, India. We will route campus and partnership requests to the right team.'] },
    ],
  },
  'how-it-works': {
    slug: 'how-it-works',
    eyebrow: 'How it works',
    title: 'Your next meal in three simple steps.',
    intro: 'Browse approved cafeterias, choose what you want, and collect your order while it is fresh.',
    sections: [
      { heading: '1. Browse', paragraphs: ['Search campus cafeterias, compare menus, and filter by cuisine, rating, distance, or availability.'] },
      { heading: '2. Order', paragraphs: ['Add items from one cafeteria to your cart and review your pickup details before placing the order.'] },
      { heading: '3. Pick up and enjoy', paragraphs: ['Follow the order status, collect your meal from the cafeteria, and keep the campus day moving.'] },
    ],
  },
  faqs: {
    slug: 'faqs',
    eyebrow: 'Student help',
    title: 'Frequently asked questions',
    intro: 'Quick answers for ordering, pickup, accounts, and campus cafeteria access.',
    sections: [
      { heading: 'Where can I order from?', paragraphs: ['You can order from cafeterias approved and listed on the UniEats campus directory.'] },
      { heading: 'How do I pay?', paragraphs: ['The current experience supports cash on pickup. Payment options may expand in a future release.'] },
      { heading: 'Can I cancel an order?', paragraphs: ['Orders can be cancelled while the cafeteria has not started preparing them. Open the order details page to check eligibility.'] },
    ],
  },
  offers: {
    slug: 'offers',
    eyebrow: 'Campus offers',
    title: 'More flavour, better value.',
    intro: 'Cafeteria offers and student rewards will appear here as partners publish them.',
    sections: [
      { heading: 'What to expect', paragraphs: ['Look out for limited-time discounts, meal bundles, and partner specials across campus.'] },
      { heading: 'Stay ready', paragraphs: ['Keep your account details current and check the cafeteria menu before placing your next order.'] },
    ],
  },
  support: {
    slug: 'support',
    eyebrow: 'UniEats support',
    title: 'Let us solve the snag.',
    intro: 'Tell us what happened and include your order number when you contact the support desk.',
    sections: [
      { heading: 'Order support', paragraphs: ['For missing items, pickup questions, or a delayed order, email support@unieats.in with your order number and campus.'] },
      { heading: 'Account support', paragraphs: ['For sign-in, verification, or password issues, use the account recovery options on the login page.'] },
    ],
  },
  partner: {
    slug: 'partner',
    eyebrow: 'Cafeteria partners',
    title: 'Bring your menu to campus students.',
    intro: 'UniEats helps cafeteria teams reach students with approved menus, clear order details, and a focused operator workspace.',
    sections: [
      { heading: 'Partner benefits', paragraphs: ['Publish your menu, receive structured orders, and keep students informed about availability and preparation.'] },
      { heading: 'Get started', paragraphs: ['Create a cafeteria account through the partner registration flow. Our team will review the details before approval.'] },
    ],
  },
  resources: {
    slug: 'resources',
    eyebrow: 'Partner resources',
    title: 'Tools for smoother cafeteria service.',
    intro: 'Helpful guidance for cafeteria partners preparing menus, managing orders, and serving students well.',
    sections: [
      { heading: 'Menu readiness', paragraphs: ['Keep prices, availability, categories, and preparation times accurate so students can make confident choices.'] },
      { heading: 'Order readiness', paragraphs: ['Review incoming orders promptly and keep pickup status current so the handoff is predictable for everyone.'] },
    ],
  },
};

export function getContentPage(slug: string) {
  return contentSlugs.includes(slug as ContentSlug) ? contentPages[slug as ContentSlug] : undefined;
}
