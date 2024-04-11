import React from "react";
import autoAnimate from '@formkit/auto-animate'

interface Props {
	expense: Expense;
	isSample?: boolean
}

function getFormattedDateAndTime() {
	const currentDate = new Date();
	const formattedDate = currentDate.toLocaleDateString();
	const timeOptions = {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	} as Intl.DateTimeFormatOptions;
	const formattedTime = currentDate
		.toLocaleTimeString("en-GB", timeOptions)

	return { formattedDate, formattedTime };
}

const ExpenseDetails = ({ expense, isSample }: Props) => {
	const { formattedDate, formattedTime } = getFormattedDateAndTime();
	return (
		<div className="max-w-md min-w-40 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
			<div className="flex flex-row justify-between items-start gap-8 p-8">
				<div>
					<div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
						{expense.type}
					</div>
					<p className="block mt-1 text-lg leading-tight font-medium text-black">
						{expense.item}
					</p>
					{expense.date && <p className="mt-2 text-gray-500">
						Date: {expense.date}
					</p>}
					{expense.time && <p className="mt-2 text-gray-500">
						Time: {expense.time}
					</p>}
					{expense.type === "product" && (
						<>
							{expense.manufactureDate && (
								<p className="mt-2 text-gray-500">
									Manufacture Date: {expense.manufactureDate}
								</p>
							)}
							{expense.expiryDate && (
								<p className="mt-2 text-gray-500">
									Expiry Date: {expense.expiryDate}
								</p>
							)}
							{expense.brand && (
								<p className="mt-2 text-gray-500">Brand: {expense.brand}</p>
							)}
						</>
					)}
					{expense.type === "activity" && (
						<>
							{expense.duration !== null && (
								<p className="mt-2 text-gray-500">
									Duration: {expense.duration} hours
								</p>
							)}
							{expense.startDate !== null && (
								<p className="mt-2 text-gray-500">
									Start Date: {expense.startDate}
								</p>
							)}
							{expense.endDate !== null && (
								<p className="mt-2 text-gray-500">
									End Date: {expense.endDate}
								</p>
							)}
							{expense.company && (
								<p className="mt-2 text-gray-500">Company: {expense.company}</p>
							)}
						</>
					)}
				</div>
				<div className="justify-end text-end">
				{expense.expenditure !== null && (
					<p className="mt-2 text-lg leading-tight font-medium text-black">
						${expense.expenditure}
					</p>
				)}
				{isSample && (<p className="text-green-800">NOT FOR SALE</p>)}
				</div>
			</div>
		</div>
	);
};

export default ExpenseDetails;
