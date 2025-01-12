import DefaultTheme from "vitepress/theme";

export default {
	title: "Pilates Studio Documentation",
	description: "Technical documentation for the Pilates Studio application",
	themeConfig: {
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Features", link: "/features/" },
			{ text: "Architecture", link: "/architecture/" },
		],
		sidebar: [
			{
				text: "Core Concepts",
				items: [
					{
						text: "Session Management",
						link: "/core-concepts/session-management",
					},
					{
						text: "Memoization Patterns",
						link: "/core-concepts/memoization-patterns",
					},
					{
						text: "Async Patterns",
						link: "/core-concepts/async-component-chain",
					},
				],
			},
			{
				text: "Features",
				items: [
					{
						text: "Trainee Availability System",
						link: "/features/trainee-availability",
					},
				],
			},
			{
				text: "Technical Details",
				items: [
					{ text: "Data Structures", link: "/technical/data-structures" },
				],
			},
			{
				text: "Architecture & Refactoring",
				items: [
					{
						text: "Refactoring Journey",
						link: "/architecture/refactoring-journey",
					},
				],
			},
		],
		colorMode: {
			defaultMode: "dark",
			disableSwitch: true,
			classSuffix: "",
		},
		logo: "/logo.png",
	},
	markdown: {
		theme: "material-palenight",
	},
};
