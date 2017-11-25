import hasOwnProp from "has-own-prop";
import flatten from "flatten";

const preparePlugin = plugin => {
	const blacklistSet = new Set(plugin.blacklist);
	const transforms = plugin.transforms.map(transform => {
		if (typeof transform[1] === "function") {
			return transform;
		}
		blacklistSet.add(transform[0]);
		return [transform[0], incoming => {
			return [
				[transform[1], incoming[transform[0]]]
			];
		}];
	});
	const blacklist = Array.from(blacklistSet);
	return { transforms, blacklist };
};

const generateMappings = (transforms, incoming) => {
	return flatten(transforms.filter(transform => {
		return hasOwnProp(incoming, transform[0]);
	}).map(transform => {
		return transform[1](incoming);
	}), 1);
};

const transformOne = (incoming, mappings, blacklist) => {
	const outgoing = {};
	for (const mapping of mappings) {
		outgoing[mapping[0]] = mapping[1];
	}
	for (const property of Object.keys(incoming)) {
		if (!hasOwnProp(outgoing, property)) {
			outgoing[property] = incoming[property];
		}
	}
	for (const property of blacklist) {
		if (hasOwnProp(outgoing, property)) {
			delete outgoing[property];
		}
	}
	return outgoing;
};

const transformProperties = (incoming, plugins) => {
	return plugins.reduce((inProgress, plugin) => {
		const preparedPlugin = preparePlugin(plugin);
		const mappings = generateMappings(preparedPlugin.transforms, inProgress);
		return transformOne(inProgress, mappings, preparedPlugin.blacklist);
	}, incoming);
};

export { preparePlugin, generateMappings, transformOne, transformProperties };
