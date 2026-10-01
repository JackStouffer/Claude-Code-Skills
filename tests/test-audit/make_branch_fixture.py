"""Build the round-2 fixture: a feature branch with committed and untracked agent tests."""
import sys
from pathlib import Path

from make_fixture import ERRORS_MD, git, pricing_at

RECEIPT_MAIN = '''\
from .pricing import order_total


def format_money(amount):
    return f"${amount:,.2f}"


class Receipt:
    def __init__(self, items, coupon=None):
        self.items = items
        self.coupon = coupon
        self._lines = []

    def render(self):
        self._lines = ["<h1>Your receipt</h1>"]
        for price, qty in self.items:
            self._lines.append(f"{qty} x {format_money(price)}")
        self._lines.append(f"Total: {format_money(order_total(self.items, self.coupon))}")
        return "\\n".join(self._lines)
'''

RECEIPT_BRANCH = '''\
from .pricing import normalize_coupon, order_total


def format_money(amount):
    return f"${amount:,.2f}"


def format_item_count(n):
    return "1 item" if n == 1 else f"{n} items"


class Receipt:
    def __init__(self, items, coupon=None):
        self.items = items
        self.coupon = coupon
        self._lines = []

    def render(self):
        self._lines = ["<h1>Your receipt</h1>"]
        self._lines.append(format_item_count(sum(q for _, q in self.items)))
        for price, qty in self.items:
            self._lines.append(f"{qty} x {format_money(price)}")
        if self.coupon:
            self._lines.append(f"Coupon {normalize_coupon(self.coupon)} applied")
        self._lines.append(f"Total: {format_money(order_total(self.items, self.coupon))}")
        return "\\n".join(self._lines)
'''

WIP = '''

    def tax_line(self, rate):
        # WIP: waiting on the tax service contract before wiring this into render()
        raise NotImplementedError
'''

TEST_PRICING = '''\
import unittest
from decimal import Decimal

from shop.pricing import SHIPPING_FEE, PricingError, apply_coupon, line_total, order_total, shipping


class PricingTests(unittest.TestCase):
    def test_bad_quantity_error_code(self):
        with self.assertRaises(PricingError) as ctx:
            line_total(Decimal("10.00"), 0)
        self.assertEqual(ctx.exception.code, "E_QTY_RANGE")

    def test_quantity_upper_bound(self):
        self.assertEqual(line_total(Decimal("1.00"), 99), Decimal("99.00"))
        with self.assertRaises(PricingError):
            line_total(Decimal("1.00"), 100)

    def test_free_shipping_boundary(self):
        self.assertEqual(shipping(Decimal("50.00")), Decimal("0"))
        self.assertEqual(shipping(Decimal("49.99")), Decimal("5.99"))

    def test_shipping_fee_constant(self):
        self.assertEqual(SHIPPING_FEE, Decimal("5.99"))

    def test_free_shipping_uses_discounted_subtotal(self):
        self.assertEqual(order_total([(Decimal("55.00"), 1)], coupon="SAVE10"), Decimal("55.49"))

    def test_coupons(self):
        for code, expected in [("SAVE10", "90.00"), ("HALF", "50.00"), (" save10 ", "90.00")]:
            with self.subTest(code=code):
                self.assertEqual(apply_coupon(Decimal("100.00"), code), Decimal(expected))


if __name__ == "__main__":
    unittest.main()
'''

TEST_CHECKOUT = '''\
import unittest
from decimal import Decimal

from shop.receipt import Receipt


class ReceiptIntegrationTests(unittest.TestCase):
    def test_receipt_total_reflects_coupon_and_shipping(self):
        text = Receipt([(Decimal("55.00"), 1)], coupon="SAVE10").render()
        self.assertEqual(text.splitlines()[-1], "Total: $55.49")

    def test_receipt_lists_each_line(self):
        text = Receipt([(Decimal("2.50"), 4), (Decimal("1000.00"), 1)]).render()
        self.assertIn("4 x $2.50", text)
        self.assertIn("1 x $1,000.00", text)


if __name__ == "__main__":
    unittest.main()
'''

TEST_RECEIPT = '''\
import unittest
from decimal import Decimal
from unittest import mock

from shop import receipt
from shop.pricing import order_total
from shop.receipt import Receipt, format_item_count, format_money


class ReceiptTests(unittest.TestCase):
    def test_item_count_pluralization(self):
        self.assertEqual(format_item_count(1), "1 item")
        self.assertEqual(format_item_count(3), "3 items")

    def test_header(self):
        self.assertIn("<h1>Your receipt</h1>", Receipt([(Decimal("10.00"), 1)]).render())

    def test_total_line_with_coupon(self):
        text = Receipt([(Decimal("55.00"), 1)], coupon="SAVE10").render()
        self.assertEqual(text.splitlines()[-1], "Total: $55.49")

    def test_total_line_format(self):
        items = [(Decimal("12.00"), 2)]
        lines = Receipt(items).render().splitlines()
        self.assertEqual(lines[-1], "Total: " + format_money(order_total(items)))

    def test_render_populates_lines(self):
        r = Receipt([(Decimal("10.00"), 1)])
        r.render()
        self.assertEqual(len(r._lines), 4)

    def test_coupon_line_only_when_coupon(self):
        self.assertNotIn("Coupon", Receipt([(Decimal("10.00"), 1)]).render())
        self.assertIn("Coupon SAVE10 applied", Receipt([(Decimal("10.00"), 1)], coupon=" save10 ").render())

    def test_format_money_called(self):
        with mock.patch.object(receipt, "format_money", return_value="$0.00") as m:
            Receipt([(Decimal("10.00"), 1), (Decimal("5.00"), 2)]).render()
        self.assertEqual(m.call_count, 3)


if __name__ == "__main__":
    unittest.main()
'''

TEST_RECEIPT_EDGE = '''\
import unittest
from decimal import Decimal

from shop.receipt import Receipt, format_item_count


class ReceiptEdgeTests(unittest.TestCase):
    def test_empty_receipt_renders(self):
        text = Receipt([]).render()
        self.assertIsNotNone(text)

    def test_large_quantity_count(self):
        self.assertEqual(format_item_count(99), "99 items")


if __name__ == "__main__":
    unittest.main()
'''


def write(dest, rel, text):
    (dest / rel).write_text(text)


def main(dest):
    dest = Path(dest)
    if dest.exists():
        sys.exit(f"{dest} already exists")
    for d in ("shop", "tests", "docs"):
        (dest / d).mkdir(parents=True)
    write(dest, "shop/__init__.py", "")
    write(dest, "tests/__init__.py", "")
    write(dest, "docs/errors.md", ERRORS_MD)
    write(dest, "shop/pricing.py", pricing_at(5))
    write(dest, "shop/receipt.py", RECEIPT_MAIN)
    write(dest, "tests/test_pricing.py", TEST_PRICING)
    write(dest, "tests/test_checkout.py", TEST_CHECKOUT)
    git(dest, "init", "-q", "-b", "main")
    git(dest, "config", "user.email", "dev@example.com")
    git(dest, "config", "user.name", "Dev")
    git(dest, "add", "-A")
    git(dest, "commit", "-q", "-m", "Pricing, receipts, and their tests")

    git(dest, "checkout", "-q", "-b", "receipt-summary")
    write(dest, "shop/receipt.py", RECEIPT_BRANCH)
    git(dest, "commit", "-q", "-am", "Add item count and coupon lines to receipt (#240)")
    write(dest, "tests/test_receipt.py", TEST_RECEIPT)
    git(dest, "add", "-A")
    git(dest, "commit", "-q", "-m", "Add receipt tests")

    write(dest, "tests/test_receipt_edge.py", TEST_RECEIPT_EDGE)
    with open(dest / "shop" / "receipt.py", "a") as f:
        f.write(WIP)


if __name__ == "__main__":
    main(sys.argv[1])
