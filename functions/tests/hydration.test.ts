import { processDataSet } from "../src/services/hydration";

const data = [
    {
        product_category: "1",
        daily_sales: "50"
    },
    {
        product_category: "1",
        daily_sales: "25"
    },
    {
        product_category: "2",
        daily_sales: "100"
    }
];

test("data set with category", () => {
    const result = processDataSet({
        "data": "[[daily_sales]]((product_category))",
        "label": "((product_category))"
    }, data);
    console.log(result);
    expect(result).toStrictEqual([
        {
            data: ["50", "25"],
            label: "1"
        },
        {
            data: ["100"],
            label: "2"
        }
    ]);
});

test("data set without category", () => {
    const result = processDataSet({
        "data": "[[daily_sales]]",
        "label": "Cars"
    }, data);
    console.log(result);
    expect(result).toStrictEqual([
        {
            data: ["50", "25", "100"],
            label: "Cars"
        }
    ]);
});
