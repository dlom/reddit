import test from "ava";
import hasOwnProp from "has-own-prop";

import { preparePlugin, transformOne, generateMappings, transformProperties, createSkeleton } from "../src/transform";

const incoming = {
	a: "Property 1",
	c: "Property 2",
	e: "Property 3",
	q: 7,
	bad: "Bad Property",
	other: "Other Property"
};

const plugin = {
	transforms: [
		["a", "b"],
		["c", "d"],
		["e", incoming => [["f", `${incoming.e} is cool`], ["z", incoming.q + 3]]]
	],
	blacklist: [
		"e",
		"bad"
	]
};

const final = {
	b: "Property 1",
	d: "Property 2",
	f: "Property 3 is cool",
	q: 7,
	z: 10,
	other: "Other Property"
};

const plugin2 = {
	transforms: [
		["d", "m"],
		["not", "there"],
		["bad", "good"],
		["other", incoming => [["other", `${incoming.other} changed!`]]],
		["b", incoming => (incoming.z === 10) ? [] : [["should", "not be here"]]]
	],
	blacklist: [
		"q"
	]
};

const final2 = {
	b: "Property 1",
	m: "Property 2",
	f: "Property 3 is cool",
	z: 10,
	other: "Other Property changed!"
};

test("preparePlugin()", t => {
	const preparedPlugin = preparePlugin(plugin);
	const preparedTransforms = preparedPlugin.transforms;
	const preparedBlacklist = preparedPlugin.blacklist;

	t.true(Array.isArray(preparedTransforms));
	t.is(preparedTransforms.length, plugin.transforms.length);
	for (const transform of preparedTransforms) {
		t.true(Array.isArray(transform));
		t.is(transform.length, 2);
		t.is(typeof transform[0], "string");
		t.is(typeof transform[1], "function");
	}

	t.true(Array.isArray(preparedBlacklist));
	t.deepEqual(preparedBlacklist.sort(), plugin.transforms.filter(transform => {
		return typeof transform[1] === "string";
	}).map(transform => transform[0]).concat(plugin.blacklist).sort());
});

test("generateMappings()", t => {
	const preparedPlugin = preparePlugin(plugin);
	const mappings = generateMappings(preparedPlugin.transforms, incoming);

	t.true(Array.isArray(mappings));
	for (const mapping of mappings) {
		t.true(Array.isArray(mapping));
		t.is(mapping.length, 2);
		t.is(typeof mapping[0], "string");
	}
});

test("generateMappings() - empty array", t => {
	const preparedPlugin = preparePlugin({ transforms: [], blacklist: [] });
	generateMappings(preparedPlugin.transforms, incoming);
	t.pass();
});

test("transformOne()", t => {
	const preparedPlugin = preparePlugin(plugin);
	const mappings = generateMappings(preparedPlugin.transforms, incoming);
	const outgoing = transformOne(incoming, mappings, preparedPlugin.blacklist);

	t.is(typeof outgoing, "object");
	t.deepEqual(outgoing, final);
});

test("transformProperties()", t => {
	const plugins = [
		plugin,
		plugin2
	];
	const outgoing = transformProperties(incoming, plugins);
	t.is(typeof outgoing, "object");
	t.deepEqual(outgoing, final2);
});

test("createSkeleton()", t => {
	const properties = [
		["a", 1],
		["b", 2],
		["c", 3]
	];

	const final = {
		a: 1,
		b: 2,
		c: 3
	};

	const { symbol, skeleton } = createSkeleton(properties);
	const incoming = {};
	incoming[symbol] = Symbol("value");
	const { transforms, blacklist } = skeleton;
	const outgoing = transformProperties(incoming, [skeleton]);

	t.is(typeof symbol, "symbol");
	t.true(Array.isArray(transforms));
	t.is(transforms.length, properties.length);
	for (const transform of transforms) {
		t.true(Array.isArray(transform));
		t.is(transform.length, 2);
		t.is(typeof transform[0], "symbol");
		t.is(typeof transform[1], "function");
	}
	t.true(Array.isArray(blacklist));
	t.is(blacklist.length, 1);
	t.is(blacklist[0], symbol);
	t.false(hasOwnProp(outgoing, symbol));
	t.deepEqual(outgoing, final);
});
