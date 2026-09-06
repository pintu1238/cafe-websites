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


contentPages.about.sections = [
  { heading: 'Built around campus life', paragraphs: ['Classes, societies and study sessions keep your day full. UniEats brings cafeteria discovery, menus and pickup updates into one place, so choosing a meal takes less effort.'] },
  { heading: 'Clarity before checkout', paragraphs: ['See the cafeteria, available dishes, prices and preparation estimates before ordering. Your cart stays with one cafeteria so collection is straightforward.'] },
  { heading: 'A workspace for local kitchens', paragraphs: ['Cafeteria partners receive structured orders and update their status as meals are prepared. Students and kitchen teams work from the same order details.'] },
];
contentPages['how-it-works'].sections = [
  { heading: 'Choose your cafeteria', paragraphs: ['Browse campus cafeterias or open the Menu page. Choose a kitchen, filter the dishes and check availability before adding your favourites.'], items: ['Look for an open cafeteria', 'Review ingredients and preparation estimates'] },
  { heading: 'Review and place your order', paragraphs: ['Sign in, add dishes from one cafeteria and review quantities, instructions and the final total in your cart. Cash on pickup is the currently supported payment method.'], items: ['One cafeteria per cart', 'Check the total and collection details'] },
  { heading: 'Follow the status and collect', paragraphs: ['Open My Orders to follow your meal from Pending to Ready. At the cafeteria, show your order number, pay as indicated and collect your food.'], items: ['Wait for the Ready status', 'Check your items at pickup'] },
];
contentPages.faqs.sections = [
  { heading: 'Where can I order from?', paragraphs: ['Browse Cafeterias for approved campus outlets. The Menu page lets you choose a cafeteria and search its actual dishes. Availability and opening status are shown with the menu.'] },
  { heading: 'How do I pay for my order?', paragraphs: ['UniEats currently supports cash on pickup. Review the final price and any charges at checkout before you place the order. Pay at the cafeteria when collecting your meal.'] },
  { heading: 'Can I order from multiple cafeterias at once?', paragraphs: ['Your cart can contain items from one cafeteria at a time. Finish the current order or remove its items before starting an order with another cafeteria.'] },
  { heading: 'How do I know when my pickup is ready?', paragraphs: ['Go to My Orders and open the order details. The cafeteria updates the order from Pending through preparation to Ready. Collect your meal when it is marked Ready and show the order number.'] },
  { heading: 'Can I cancel an order?', paragraphs: ['Open the order details to see whether cancellation is still available. Eligibility depends on the current order status and is checked when you request cancellation. If preparation has started, contact support with the order number.'] },
  { heading: 'What if my order is delayed or an item is missing?', paragraphs: ['Check the latest status and confirm your order number at the collection counter. For follow-up, use the Support page with your order number and a description of the issue. You can also call the number on the Contact page.'] },
  { heading: 'How do I reset my password or verify my email?', paragraphs: ['Use Forgot password from the sign-in page to begin account recovery. If sign-in asks for email verification, follow the verification link or use the resend verification option. Never share your password or reset code with anyone.'] },
  { heading: 'Where can I see student offers?', paragraphs: ['Open Offers to see published deals from cafeterias. Read each offer and check its availability with the cafeteria. A listed offer does not automatically change your checkout total.'] },
  { heading: 'Where do I check dietary and allergen information?', paragraphs: ['Menu cards identify vegetarian and spicy dishes where this information is provided. For specific ingredients or allergies, confirm directly with the cafeteria before placing an order.'] },
  { heading: 'How can my cafeteria join UniEats?', paragraphs: ['Use Partner With Us to submit your business, campus and contact details. Our team reviews the application before granting access. Approved shopkeepers sign in through Vendor Login.'] },
];
contentPages.contact.sections = [
  { heading: 'Talk to the right people', paragraphs: ['Send a general question, feedback or a campus enquiry using this form. For an existing order, include the order number so the team can understand the issue.'] },
  { heading: 'Planning a partnership?', paragraphs: ['The dedicated partner application collects the details needed to review a cafeteria. Use Partner With Us to share your business and campus information.'] },
];
contentPages.support.sections = [
  { heading: 'Help with your campus day', paragraphs: ['Tell us what happened and what you have tried. Include your order number for pickup and food issues, or your registered email for account questions.'] },
  { heading: 'Keep your account details safe', paragraphs: ['We do not need your password, verification code or payment details. Your request receives a reference after it is saved; keep that reference for follow-up.'] },
];
contentPages.partner.sections = [
  { heading: 'Meet students where they order', paragraphs: ['Bring your cafeteria into the campus directory with clear menus, prices and pickup information. Help students find what your kitchen does best.'] },
  { heading: 'Keep service in sync', paragraphs: ['Approved partners use a dedicated workspace to review orders and update preparation status. Clear handovers help your team manage the lunch rush.'], items: ['Structured order details', 'Preparation and pickup updates', 'Access scoped to your cafeteria'] },
  { heading: 'A considered onboarding process', paragraphs: ['Submit your cafeteria details and contact information. The team reviews your application before approving access; a student account does not become a vendor account automatically.'] },
];

export function getContentPage(slug: string) {
  return contentSlugs.includes(slug as ContentSlug) ? contentPages[slug as ContentSlug] : undefined;
}
