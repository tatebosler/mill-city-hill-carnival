# Mill City Hill Carnival Assistant Tool

Your task is to help build a Next.js application to allow runners to create a workout plan for the annual Mill City Hill Carnival.

In the Mill City Hill Carnival, runners choose a total hill distance (measured in hundreds of meters) and a total number of hills to climb. The Next.js application should assist the runner in spreading their distance out over the correct number of reps. For example, one runner might choose to run 2,700 meters over 10 hills.

Hills are marked at 100m, 200m, 300m, and 400m.

The biggest rules are:

- The minimum is 1,000 meters over 4 hills.
- The maximum is 5,000 meters over 20 hills.
- One hill is equal to 100, 200, 300, or 400 meters of distance.
- A workout must include at least one rep at each of the four distances.

## Requirements

- This is a single-page web application with no database, user accounts, or registration. There is no administrative GUI. Everything should be done within a single web page. If any storage is needed (e.g. to persist user data between page loads), use local storage.
- Design this page for mobile devices first using Tailwind 4, and follow WCAG accessibility guidelines.
- Ask the user to type in their desired hill count and distance. Validate that the user's inputs conform to the Hill Carnival rules, and are mathematically possible (e.g. 5000 meters over 4 hills is not mathematically possible, and 1,200 meters over 4 hills violates the distance diversity rule)
  - Both of these fields must accept integers, with HTML validation rules in place.
  - The Hills field must step in increments of 1.
  - The Distance field must step in increments of 100.
- Near the form fields for distance and hill count, display a "Prefill from MCR Training Plans" button. When the button is clicked, display a modal that asks the user to choose which training plan distance they are following ["≤25 miles per week", "26-40 miles per week", "41-60 miles per week", "60+ miles per week"].
  - Each training plan distance has its own minimum and maximum values for hill count and distance. Read these values from a configuration file that is tracked in Git.
  - Once the user selects a training plan distance, offer the user "Minimum", "Midpoint", and "Maximum" choices for distance and hills. For example, if the 26-40 miles per week training plan is configured with 2200-2800m over 8-10 hills, offer a Minimum of 2200m and 8 reps, a Midpoint of 2500m and 9 reps, and a Maximum of 2800m and 10 reps.
  - When the user chooses a plan, copy the corresponding distance and rep selections to the main form, then close the modal.
- Below the Distance & Reps form fields, create an interface that allows the user to build their workout. See @desktop.png for an example of how to lay out the Workout Builder on desktop.
  - Give the user buttons to add 100m, 200m, 300m, or 400m hills to the workout.
  - 