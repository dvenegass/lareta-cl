from django.test import SimpleTestCase

from apps.expenses.splitting import compute_balances, settle, split_evenly


class SplittingTests(SimpleTestCase):
    def test_split_evenly_distributes_remainder(self):
        self.assertEqual(split_evenly(10, [3, 1, 2]), {1: 4, 2: 3, 3: 3})
        self.assertEqual(split_evenly(10, []), {})

    def test_balances(self):
        # Diego (1) pagó 30.000, Ana (2) pagó 0, Beto (3) pagó 0 → 10.000 cada uno.
        balances = compute_balances([(1, 30000)], [1, 2, 3])

        self.assertEqual(balances[1], {"paid": 30000, "share": 10000, "balance": 20000})
        self.assertEqual(balances[2]["balance"], -10000)

    def test_payer_who_does_not_attend_gets_everything_back(self):
        balances = compute_balances([(9, 6000)], [1, 2])

        self.assertEqual(balances[9], {"paid": 6000, "share": 0, "balance": 6000})

    def test_settle(self):
        transfers = settle({1: 20000, 2: -10000, 3: -10000})

        self.assertCountEqual(transfers, [(2, 1, 10000), (3, 1, 10000)])

    def test_settle_balances_out(self):
        balances = compute_balances([(1, 25000), (2, 5000), (3, 3001)], [1, 2, 3, 4])
        transfers = settle({uid: b["balance"] for uid, b in balances.items()})

        final = {uid: b["balance"] for uid, b in balances.items()}
        for debtor, creditor, amount in transfers:
            final[debtor] += amount
            final[creditor] -= amount
        self.assertTrue(all(value == 0 for value in final.values()))
