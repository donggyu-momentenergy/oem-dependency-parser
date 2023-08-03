import { argv } from "process";

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
			// batteryCode: ["A", "B"]
		},
		"eb500": null,
	},
	batteryCode: ["1234", "5678"],
};

const DEBUG_MODE = Boolean(argv[2]) || false;

function log(...items: any[]) {
	if (DEBUG_MODE) console.log(...items);
}

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
				log("=====", level);
				log(`${rootKey.toUpperCase()} =`, root);
				log("-----");
				log(`${rootKey}.${key} =`, root[key]);
				if (root[key] && typeof root[key] === "object") {
					const children = createAllCombinations(
						root[key] as RecursivePrimitive,
						level + 1,
						{ ...objSoFar, [rootKey]: key },
						key,
					);
					combinations = combinations.concat(children);
				} else {
					combinations.push({ ...objSoFar, [rootKey]: root[key] || key });
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
				log("=====", level);
				log(`${rootKey.toUpperCase()} =`, root);
				log("-----");
				log(`${rootKey}.${key} =`, root[key]);
	
				const children = createAllCombinations(
					root[key] as RecursivePrimitive,
					level + 1,
					{ ...objSoFar },
					key,
				);
	
				if (newCombos.length) {
					const newNewCombos: Primitive = [];
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

	log(rootKey, combinations.length);
	
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
			log(`level ${level}, root = ${root} key -> ${key}`);
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
			log(`level ${level}, root = ${root} key -> ${key}`);
			combinations *= countAllCombinations(root[key] as RecursivePrimitive, level + 1);
		}
	}

	log(`level ${level}: ${combinations}`);
	log("------------");
	return combinations;
}

const res = createAllCombinations(structure1, 0, {}, "root");

fs.writeFile("output.json", JSON.stringify(res, null, 4))
	.then(() => log(`wrote ${res.length} objects to file`));
