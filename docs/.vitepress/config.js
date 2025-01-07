module.exports = {
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
				text: "Features",
				items: [
					{
						text: "Trainee Availability System",
						link: "/features/trainee-availability",
					},
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
	},
};
