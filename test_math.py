import unittest
import os

class TestMath(unittest.TestCase):
    def test_add(self):
        from math_util import add
        self.assertEqual(add(2, 3), 5)

    def test_divide(self):
        from math_util import divide
        self.assertEqual(divide(6, 3), 2)
        with self.assertRaises(ZeroDivisionError):
            divide(1, 0)

if __name__ == "__main__":
    unittest.main()
