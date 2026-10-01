"""Build the fixture git repo at argv[1]. Ground truth is in test-scenario.md."""
import subprocess
import sys
from pathlib import Path

PRICING = '''\
from decimal import Decimal

FREE_SHIPPING_THRESHOLD = Decimal("50.00")
SHIPPING_FEE = Decimal("5.99")
MAX_QUANTITY = {max_qty}

COUPONS = {{"SAVE10": Decimal("0.10"), "HALF": Decimal("0.50")}}


class PricingError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def normalize_coupon(code):
    return code.strip().upper()


def line_total(price, quantity):
    if quantity < 1 or quantity > MAX_QUANTITY:
        raise PricingError("E_QTY_RANGE", f"quantity must be 1..{{MAX_QUANTITY}}")
    return price * quantity


def apply_coupon(subtotal, code):
    if code is None:
        return subtotal
    rate = COUPONS.get(normalize_coupon(code))
    if rate is None:
        raise PricingError("E_COUPON_UNKNOWN", "unknown coupon")
    return (subtotal * (1 - rate)).quantize(Decimal("0.01"))


def shipping(subtotal):
    return Decimal("0") if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_FEE


def order_total(items, coupon=None):
    subtotal = sum((line_total(p, q) for p, q in items), Decimal("0"))
    discounted = apply_coupon(subtotal, coupon)
    return discounted + shipping({shipping_arg})
'''

WIP = '''

def bulk_discount(subtotal, quantity):
    # WIP: tiered bulk pricing, thresholds still being decided with finance
    if quantity >= 50:
        return (subtotal * Decimal("0.95")).quantize(Decimal("0.01"))
    return subtotal
'''

ERRORS_MD = '''\
# Pricing error codes

`PricingError.code` is part of the public checkout API. The mobile app and the
partner checkout widget switch on these strings to choose the message they show,
so renaming one is a breaking change that needs a versioned rollout.

| Code | Meaning |
|------|---------|
| `E_QTY_RANGE` | Line quantity outside 1..MAX_QUANTITY |
| `E_COUPON_UNKNOWN` | Coupon code not recognized |
'''

HEADER = '''\
import unittest
from decimal import Decimal
from unittest import mock

from shop import pricing
from shop.pricing import (
    FREE_SHIPPING_THRESHOLD,
    MAX_QUANTITY,
    PricingError,
    apply_coupon,
    line_total,
    order_total,
    shipping,
)


class PricingTests(unittest.TestCase):
'''

# (stage, body). Stage = the commit that adds the test.
TESTS = [
    (5, '''\
    def test_free_shipping_threshold_constant(self):
        self.assertEqual(FREE_SHIPPING_THRESHOLD, Decimal("50.00"))
'''),
    (1, '''\
    def test_bad_quantity_error_code(self):
        with self.assertRaises(PricingError) as ctx:
            line_total(Decimal("10.00"), 0)
        self.assertEqual(ctx.exception.code, "E_QTY_RANGE")
'''),
    (5, '''\
    def test_apply_coupon_mocked(self):
        with mock.patch.object(pricing, "apply_coupon", return_value=Decimal("90.00")) as m:
            self.assertEqual(m(Decimal("100.00"), "SAVE10"), Decimal("90.00"))
'''),
    (5, '''\
    def test_line_total_consistent(self):
        self.assertEqual(line_total(Decimal("2.50"), 4), line_total(Decimal("2.50"), 4))
'''),
    (5, '''\
    def test_order_total_runs(self):
        order_total([(Decimal("10.00"), 1)])
'''),
    (5, '''\
    def test_order_total_calls_shipping(self):
        with mock.patch.object(pricing, "shipping", return_value=Decimal("0")) as m:
            order_total([(Decimal("55.00"), 1)], coupon="SAVE10")
        m.assert_called_once_with(Decimal("49.50"))
'''),
    (5, '''\
    def test_rejects_unknown_coupon(self):
        with self.assertRaises(PricingError):
            order_total([(Decimal("10.00"), 0)], coupon="BOGUS")
'''),
    (1, '''\
    def test_free_shipping_boundary(self):
        self.assertEqual(shipping(Decimal("50.00")), Decimal("0"))
        self.assertEqual(shipping(Decimal("49.99")), Decimal("5.99"))
'''),
    (4, '''\
    def test_free_shipping_uses_discounted_subtotal(self):
        # 55.00 qualifies before the coupon, 49.50 does not after it
        self.assertEqual(order_total([(Decimal("55.00"), 1)], coupon="SAVE10"), Decimal("55.49"))
'''),
    (1, '''\
    def test_coupon_save10(self):
        self.assertEqual(apply_coupon(Decimal("100.00"), "SAVE10"), Decimal("90.00"))
'''),
    (1, '''\
    def test_coupon_half(self):
        self.assertEqual(apply_coupon(Decimal("100.00"), "HALF"), Decimal("50.00"))
'''),
    (3, '''\
    def test_max_quantity_constant(self):
        self.assertEqual(MAX_QUANTITY, 99)
'''),
    (5, '''\
    def test_pricing_error_is_exception(self):
        self.assertTrue(issubclass(PricingError, Exception))
'''),
]

COMMITS = [
    (1, "Initial pricing module"),
    (2, "Refactor pricing constants"),
    (3, "Fix MAX_QUANTITY typo from constants refactor that blocked bulk orders (#231)"),
    (4, "Fix free shipping evaluated before coupon discount (#218)"),
    (5, "Add test coverage for pricing"),
]


def pricing_at(stage):
    return PRICING.format(
        max_qty=9 if stage == 2 else 99,
        shipping_arg="discounted" if stage >= 4 else "subtotal",
    )


def tests_at(stage):
    return HEADER + "\n".join(body for s, body in TESTS if s <= stage) + '''

if __name__ == "__main__":
    unittest.main()
'''


def git(dest, *args):
    subprocess.run(["git", "-C", str(dest), *args], check=True, capture_output=True)


def main(dest):
    dest = Path(dest)
    if dest.exists():
        sys.exit(f"{dest} already exists")
    (dest / "shop").mkdir(parents=True)
    (dest / "tests").mkdir()
    (dest / "docs").mkdir()
    (dest / "shop" / "__init__.py").write_text("")
    (dest / "tests" / "__init__.py").write_text("")
    (dest / "docs" / "errors.md").write_text(ERRORS_MD)
    git(dest, "init", "-q", "-b", "main")
    git(dest, "config", "user.email", "dev@example.com")
    git(dest, "config", "user.name", "Dev")
    for stage, msg in COMMITS:
        (dest / "shop" / "pricing.py").write_text(pricing_at(stage))
        (dest / "tests" / "test_pricing.py").write_text(tests_at(stage))
        git(dest, "add", "-A")
        git(dest, "commit", "-q", "-m", msg)
    with open(dest / "shop" / "pricing.py", "a") as f:
        f.write(WIP)


if __name__ == "__main__":
    main(sys.argv[1])
