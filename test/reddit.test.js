import test from "ava";

import reddit from "../src/reddit";

test("404 handler", t => {
	t.is(reddit.x, "D");
});
