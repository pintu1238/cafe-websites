export const partnerGuides = [
  { slug: 'getting-started', category: 'ONBOARDING', title: 'Your first week with UniEats', summary: 'From application to a service-ready cafeteria.', minutes: 4, steps: [
    ['Send your application', 'Use Partner With Us to share your business name, campus, contact details and cuisine. Save the reference shown after submission. An application does not automatically create an approved vendor account.'],
    ['Prepare your details', 'Keep your campus location, opening hours, menu prices and business contact ready for review. Share documents only through a channel agreed with the UniEats team.'],
    ['Set up your workspace', 'Once your account is approved, use Vendor Login with your registered email. Customer accounts do not grant access to the cafeteria workspace.'],
    ['Run a service check', 'Check the displayed menu and pickup location with the team before accepting student orders. Make sure staff know how to identify an order number.'],
  ] },
  { slug: 'menu-readiness', category: 'MENU OPERATIONS', title: 'Make your menu easy to order', summary: 'A practical checklist for names, prices and availability.', minutes: 3, steps: [
    ['Write clear dish names', 'Use familiar names and describe the serving size, main ingredients and accompaniments. Avoid unsupported dietary or allergen claims.'],
    ['Confirm prices', 'Check the price for each item, variant and add-on. Review the checkout breakdown before publishing changes with the operations team.'],
    ['Keep availability accurate', 'Tell the team when an item sells out or your kitchen closes. Do not leave unavailable items advertised as ready to order.'],
    ['Check preparation times', 'Use a realistic estimate for normal service and make it clear where students should collect their order.'],
  ] },
  { slug: 'order-workflow', category: 'ORDER MANAGEMENT', title: 'From incoming order to pickup', summary: 'Use each order status at the right moment.', minutes: 4, steps: [
    ['Review incoming orders', 'Open your cafeteria workspace and inspect the items, quantities and instructions. Accept only the orders your kitchen can fulfil.'],
    ['Start preparation', 'Move an accepted order to Preparing when work begins. Status updates help students decide when to head to the cafeteria.'],
    ['Mark it ready', 'Set Ready only when the complete order is packed for pickup. Check the order number during handover.'],
    ['Complete the handover', 'Follow the cash-on-pickup payment method shown on the order and mark the order Completed after handover. Contact support if the order cannot be fulfilled.'],
  ] },
  { slug: 'pickup-checklist', category: 'SERVICE QUALITY', title: 'A smoother pickup, every time', summary: 'A short checklist your team can use during service.', minutes: 2, steps: [
    ['Before service', 'Confirm the kitchen is open, the collection counter is clearly marked and staff can access the order board.'],
    ['Before marking Ready', 'Match the dish, quantity, variants and special instructions to the order. Pack items to keep hot and cold food separate.'],
    ['At the counter', 'Ask for the order number, confirm the student has the correct bag and handle payment according to the order details.'],
    ['If something goes wrong', 'Record the order number and the issue. Use the support form for follow-up, or call the contact number for pickup assistance.'],
  ] },
] as const;
export function guideMarkdown(guide: typeof partnerGuides[number]) {
  return '# ' + guide.title + '\n\n' + guide.summary + '\n\n' + guide.steps.map(([heading, body], index) => '## ' + (index + 1) + '. ' + heading + '\n\n' + body).join('\n\n') + '\n\nUniEats support: support@unieats.in | +91 62849 29772\n';
}

