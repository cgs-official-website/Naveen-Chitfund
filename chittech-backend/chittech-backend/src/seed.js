require('dotenv').config();
const { pool, query, withTransaction } = require('./db');

async function seed() {
  console.log('Seeding ChitTech database...');

  // --- Admin ---
  const adminPhone = '+919999900000';
  let admin = (await query('SELECT * FROM users WHERE phone = $1', [adminPhone])).rows[0];
  if (!admin) {
    admin = (
      await query(
        `INSERT INTO users (full_name, phone, role, kyc_status)
         VALUES ('ChitTech Admin', $1, 'admin', 'APPROVED') RETURNING *`,
        [adminPhone]
      )
    ).rows[0];
  }
  console.log(`Admin ready: ${admin.phone} (login via OTP; OTP is printed to console)`);

  // --- 5 sample subscribers ---
  const subscriberSeeds = [
    { name: 'Anitha Kumar', phone: '+919999900001' },
    { name: 'Ravi Shankar', phone: '+919999900002' },
    { name: 'Priya Menon', phone: '+919999900003' },
    { name: 'Suresh Babu', phone: '+919999900004' },
    { name: 'Lakshmi Narayan', phone: '+919999900005' },
  ];

  const subscribers = [];
  for (const s of subscriberSeeds) {
    let u = (await query('SELECT * FROM users WHERE phone = $1', [s.phone])).rows[0];
    if (!u) {
      u = (
        await query(
          `INSERT INTO users (full_name, phone, role, kyc_status)
           VALUES ($1, $2, 'user', 'APPROVED') RETURNING *`,
          [s.name, s.phone]
        )
      ).rows[0];
    }
    subscribers.push(u);
  }
  console.log(`Seeded ${subscribers.length} subscriber users.`);

  // --- 2 chit groups ---
  const groupSeeds = [
    {
      name: 'Prosperity Chit - 5L / 20mo',
      chit_amount: 500000,
      duration_months: 20,
      foreman_commission_pct: 5,
      dividend_distribution_policy: 'NON_PRIZED_ONLY',
    },
    {
      name: 'Golden Nest Chit - 1L / 10mo',
      chit_amount: 100000,
      duration_months: 10,
      foreman_commission_pct: 5,
      dividend_distribution_policy: 'ALL_SUBSCRIBERS',
    },
  ];

  const groups = [];
  for (const g of groupSeeds) {
    let existing = (await query('SELECT * FROM chit_groups WHERE name = $1', [g.name])).rows[0];
    if (!existing) {
      existing = (
        await query(
          `INSERT INTO chit_groups
             (name, chit_amount, duration_months, foreman_commission_pct, status, dividend_distribution_policy)
           VALUES ($1, $2, $3, $4, 'OPEN', $5) RETURNING *`,
          [g.name, g.chit_amount, g.duration_months, g.foreman_commission_pct, g.dividend_distribution_policy]
        )
      ).rows[0];
    }
    groups.push(existing);
  }
  console.log(`Seeded ${groups.length} chit groups.`);

  // --- Enroll all 5 subscribers into the first group, with installment schedules ---
  await withTransaction(async (client) => {
    const group = groups[0];
    for (let i = 0; i < subscribers.length; i += 1) {
      const user = subscribers[i];
      const existingSub = await client.query(
        'SELECT id FROM subscriptions WHERE chit_group_id = $1 AND user_id = $2',
        [group.id, user.id]
      );
      if (existingSub.rows.length) continue;

      const ticketNumber = i + 1;
      const subRes = await client.query(
        `INSERT INTO subscriptions (chit_group_id, user_id, ticket_number, subscriber_status)
         VALUES ($1, $2, $3, 'NPS') RETURNING *`,
        [group.id, user.id, ticketNumber]
      );
      const subscription = subRes.rows[0];

      const installmentAmount = (Number(group.chit_amount) / group.duration_months).toFixed(2);
      for (let month = 1; month <= group.duration_months; month += 1) {
        await client.query(
          `INSERT INTO installments (subscription_id, month_number, amount_due, status)
           VALUES ($1, $2, $3, 'PENDING')`,
          [subscription.id, month, installmentAmount]
        );
      }
    }
  });

  console.log('Enrolled all 5 subscribers into "Prosperity Chit - 5L / 20mo" with installment schedules.');
  console.log('\nSeed complete. Test accounts (phone -> role):');
  console.log(`  ${adminPhone} -> admin`);
  subscriberSeeds.forEach((s) => console.log(`  ${s.phone} -> user (${s.name})`));
  console.log('\nLogin flow: POST /api/v1/auth/otp/request { phone }, then check server console for the OTP,');
  console.log('then POST /api/v1/auth/otp/verify { phone, code } to get a JWT.');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
