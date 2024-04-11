"use client";

import { useEffect, useRef, useState } from "react";
import ExpenseDetails from "./components/ExpenseDetails";
import autoAnimate from "@formkit/auto-animate";

const LOCAL_STORAGE_KEY = "expense_records";
const SAMPLE_RECORD: Expense = {
	date: "2024-04-11",
	time: "14:00",
	type: "product",
	item: "Rubber Ducky",
	expenditure: 100.0,
};

export default function Home() {
	const [file, setFile] = useState<File>();
	const [isLoading, setIsLoading] = useState(false);
	const [analysisResult, setAnalysisResult] = useState<Expense>();
	const [records, setRecords] = useState<Expense[]>([]);

	// Auto-animation
	const parent = useRef(null);

	useEffect(() => {
		parent.current && autoAnimate(parent.current);
	}, [parent]);

	// Add records
	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!file) return;

		setIsLoading(true);
		setAnalysisResult(undefined);

		try {
			const data = new FormData();
			data.set("file", file);

			const res = await fetch("/api/upload", {
				method: "POST",
				body: data,
			});
			if (!res.ok) throw new Error(await res.text());
			const result = await res.json();
			if (!result.success) throw new Error(result.error);

			setAnalysisResult(result.data);
			addRecord(result.data);
		} catch (e: any) {
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	const addRecord = (newRecord: Expense) => {
		const updatedRecords = [...records, newRecord];
		setRecords(updatedRecords);
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecords));
	};

	useEffect(() => {
		const records = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (records) {
			setRecords(JSON.parse(records));
		}
	}, []);

	return (
		<main>
			<form onSubmit={onSubmit}>
				<div className="flex flex-row gap-4 p-4 items-center">
					<label htmlFor="file">File</label>
					<input
						className="rounded-xl p-4 ring-2 ring-indigo-500 ring-opacity-50 cursor-pointer hover:ring-indigo-600"
						type="file"
						name="file"
						id="file"
						onChange={(e) => setFile(e.target.files?.[0])}
					/>
					<input
						className="rounded-xl p-4 ring-2 ring-indigo-500 ring-opacity-50 cursor-pointer hover:ring-indigo-600 disabled:hover:ring-gray-600"
						type="submit"
						value="Upload"
						disabled={isLoading || !file}
					/>
				</div>
			</form>
			<div ref={parent} className="flex flex-col gap-4 p-8 justify-start">
				{isLoading && <p>Uploading...</p>}
				{records.reverse().map((record, index) => (
					<ExpenseDetails
						key={index}
						expense={record}
					/>
				))}
				<ExpenseDetails
					isSample={true}
					expense={SAMPLE_RECORD}
				/>
			</div>
		</main>
	);
}
