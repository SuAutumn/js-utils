import htmlParse from "../utils/htmlParse";

test("html parse", () => {
  const value = htmlParse("   <div class=\"graph-label\">\n" +
    "        <div class=\"outer-radius\"></div>\n" +
    "    </div>");
  console.log(value);
  expect(value[0].value).toBe("   ");
})