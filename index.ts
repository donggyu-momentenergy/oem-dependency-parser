// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("node:fs/promises");

export type Primitive = number | string | boolean | null | Primitive[] | RecursivePrimitive;
export type RecursivePrimitive = { [key: string]: Primitive | RecursivePrimitive };

const structure0 = {
	model: {
		"eb300": {
			"red": ["L", "R"],
			"blue": ["T", "B", "R"]
		},
		"eb400": ["B", "R"]
	}
};

const structure1: RecursivePrimitive = {
	model: {
		"eb300": {
			color: {
				"red": {
					variant: ["L", "R"]
				},
				"blue": {
					variant: ["T", "B", "R"]
				}
			},
			condition: ["good", "ok", "fatal"]
		},
		"eb400": {
			variant: ["B", "R"],
			batteryCode: "abcdefg",
		},
		"eb500": "eb500",
	},
	batteryCode: ["1234", "5678"]
};

/**
 * 
 * @param root Root of dependency structure
 * @param level Current level of the dependency structure tree. 
 * If odd, we are at the attribute level. If even, we are at the value level.
 * @param currPath Buildup object so far
 */
function createAllCombinations(
	root: RecursivePrimitive, 
	level = 0, 
	objSoFar: any, 
	rootKey: string, 
): Primitive[] {
	let combinations: Primitive[] = [];

	if (level % 2 === 1) {
		// odd
		if (typeof root !== "object") {
			combinations.push({ ...objSoFar, [rootKey]: root });
		} else {
			for (const key in root) {
				console.log("=====");
				console.log(rootKey.toUpperCase(), root);
				console.log("-----");
				console.log(`${rootKey}.${key}`, root[key]);
				if (typeof root[key] === "object") {
					const children = createAllCombinations(
						root[key] as RecursivePrimitive,
						level + 1,
						{ ...objSoFar, [rootKey]: key },
						key,
					);
					combinations = combinations.concat(children);
				} else {
					combinations.push({ ...objSoFar, [rootKey]: root[key] });
				}
			}
		}
	} else {
		// even
		if (typeof root !== "object") {
			combinations.push({ ...objSoFar, [rootKey]: root });
		} else {
			let newCombos: Primitive[] = [];
			for (const key in root) {
				console.log("=====");
				console.log(rootKey.toUpperCase(), root);
				console.log("-----");
				console.log(`${rootKey}.${key}`, root[key]);
	
				const children = createAllCombinations(
					root[key] as RecursivePrimitive,
					level + 1,
					{ ...objSoFar },
					key,
				);
	
				if (newCombos.length) {
					const newNewCombos: Primitive = [];
					// console.log("NEWCOMBO SO FAR", newCombos.length);
					// console.log("CHILDREN SO FAR", children.length);
					for (const newCombo of newCombos) {
						if (typeof newCombo === "object") {
							for (const child of children) {
								if (typeof child === "object") {
									newNewCombos.push({ ...newCombo, ...child });
								}
							}
						}
					}
					newCombos = newNewCombos;
				} else {
					newCombos = children;
				}
	
				combinations = newCombos;
			}
		}
		
	}
	console.log(rootKey, combinations.length);
	
	// return JSON.parse(JSON.stringify(combinations));
	return combinations;
}

/**
 * Count the total number of valid combinations
 * @param root Root of dependency structure
 * @param level Current level of the dependency structure tree.
 * odd -> key level, even -> value level
 */
function countAllCombinations(root: RecursivePrimitive, level = 0): number {
	let combinations = 1;

	if (level % 2 === 1) { // odd
		combinations--;
		for (const key in root) {
			console.log(`level ${level}, root = ${root} key -> ${key}`);
			if (Array.isArray(root[key])) {
				combinations = (root[key] as Primitive[])?.length;
				break;
			} else if (typeof root[key] === "object") {
				combinations += countAllCombinations(root[key] as RecursivePrimitive, level + 1);
			} else {
				combinations++;
			}
		}
	} else { // even
		for (const key in root) {
			console.log(`level ${level}, root = ${root} key -> ${key}`);
			combinations *= countAllCombinations(root[key] as RecursivePrimitive, level + 1);
		}
	}

	console.log(`level ${level}: ${combinations}`);
	console.log("------------");
	return combinations;
}

const res = createAllCombinations(structure1, 0, {}, "root");

fs.writeFile("output.json", JSON.stringify(res, null, 4))
	.then(() => console.log(`wrote ${res.length} objects to file`));
