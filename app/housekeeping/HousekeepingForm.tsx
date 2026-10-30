"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const NEEDS = [
	"Bathrooms and kitchen",
	"Beds made, sheets changed",
	"Laundry washed, folded, put away",
	"Dishes and counters",
	"General tidying",
	"Trash and recycling out",
];

export default function HousekeepingForm() {
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState("");

	const submit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (status === "sending") return;
		setError("");
		const form = e.currentTarget;
		const data = new FormData(form);
		const payload = {
			name: data.get("name"),
			email: data.get("email"),
			phone: data.get("phone"),
			forWhom: data.get("forWhom"),
			neighborhood: data.get("neighborhood"),
			bedrooms: data.get("bedrooms"),
			bathrooms: data.get("bathrooms"),
			visitsPerWeek: data.get("visitsPerWeek"),
			needs: data.getAll("needs"),
			startDate: data.get("startDate"),
			duration: data.get("duration"),
			notes: data.get("notes"),
			company: data.get("company"),
		};
		setStatus("sending");
		try {
			const res = await fetch("/api/housekeeping/request/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error || "Something went wrong.");
			setStatus("sent");
			form.reset();
		} catch (err: unknown) {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Something went wrong. Please try again or text (914) 863-7902.");
		}
	};

	if (status === "sent") {
		return (
			<div className="hk-form hk-sent">
				<div className="big">✓</div>
				<h2>Got it. We&apos;ll be in touch shortly.</h2>
				<p>
					We&apos;ll come back with a quote and available days, usually within a few hours. A copy of what you sent is on its way to your inbox.
					Anything urgent? Text <a href="sms:+19148637902">(914) 863-7902</a>.
				</p>
			</div>
		);
	}

	return (
		<form className="hk-form" onSubmit={submit}>
			<h2>Request a housekeeping quote</h2>
			<p className="hk-form-sub">Takes a minute. No card, no commitment.</p>

			<div className="hk-row">
				<div className="hk-field">
					<label htmlFor="hk-name">Your name</label>
					<input id="hk-name" name="name" required autoComplete="name" />
				</div>
				<div className="hk-field">
					<label htmlFor="hk-for">Who is it for?</label>
					<select id="hk-for" name="forWhom" defaultValue="Me">
						<option>Me</option>
						<option>A family member</option>
						<option>A client or employer</option>
						<option>Someone recovering from surgery or illness</option>
					</select>
				</div>
			</div>
			<div className="hk-row">
				<div className="hk-field">
					<label htmlFor="hk-email">Email</label>
					<input id="hk-email" name="email" type="email" required autoComplete="email" />
				</div>
				<div className="hk-field">
					<label htmlFor="hk-phone">Phone</label>
					<input id="hk-phone" name="phone" type="tel" required autoComplete="tel" />
				</div>
			</div>

			<div className="hk-field">
				<label htmlFor="hk-hood">Neighborhood</label>
				<input id="hk-hood" name="neighborhood" required placeholder="SoHo, Upper West Side, Tribeca…" />
			</div>

			<div className="hk-row hk-row-3">
				<div className="hk-field">
					<label htmlFor="hk-br">Bedrooms</label>
					<select id="hk-br" name="bedrooms" defaultValue="2">
						<option value="Studio">Studio</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
						<option>4+</option>
					</select>
				</div>
				<div className="hk-field">
					<label htmlFor="hk-ba">Bathrooms</label>
					<select id="hk-ba" name="bathrooms" defaultValue="1">
						<option>1</option>
						<option>2</option>
						<option>3+</option>
					</select>
				</div>
				<div className="hk-field">
					<label htmlFor="hk-visits">Visits per week</label>
					<select id="hk-visits" name="visitsPerWeek" defaultValue="2">
						<option>2</option>
						<option>3</option>
						<option>4</option>
						<option value="5 (weekdays)">5 (weekdays)</option>
						<option value="Not sure">Not sure yet</option>
					</select>
				</div>
			</div>

			<fieldset className="hk-field hk-checks">
				<legend>What should each visit cover?</legend>
				<div className="hk-check-grid">
					{NEEDS.map((n, i) => (
						<label key={n} className="hk-check">
							<input type="checkbox" name="needs" value={n} defaultChecked={i < 5} />
							<span>{n}</span>
						</label>
					))}
				</div>
			</fieldset>

			<div className="hk-row">
				<div className="hk-field">
					<label htmlFor="hk-start">When would you like to start?</label>
					<input id="hk-start" name="startDate" placeholder="This Monday, next week, ASAP…" />
				</div>
				<div className="hk-field">
					<label htmlFor="hk-dur">For how long?</label>
					<select id="hk-dur" name="duration" defaultValue="Not sure">
						<option>A few weeks</option>
						<option>About a month</option>
						<option>A few months</option>
						<option>Ongoing</option>
						<option>Not sure</option>
					</select>
				</div>
			</div>

			<div className="hk-field">
				<label htmlFor="hk-notes">Anything we should know?</label>
				<textarea id="hk-notes" name="notes" rows={3} placeholder="Pets, building access, laundry in-unit or in the building, areas to avoid, days that work best…" />
			</div>

			<div className="hk-hp" aria-hidden="true">
				<label>Company <input name="company" tabIndex={-1} autoComplete="off" /></label>
			</div>

			<button className="hk-submit" type="submit" disabled={status === "sending"}>
				{status === "sending" ? "Sending…" : "Send my request"}
			</button>
			{error ? <p className="hk-error">{error}</p> : null}
			<p className="hk-fine">
				We reply by email or text with a per-visit price and the days we can hold for you. Prefer to talk? Call or text{" "}
				<a href="tel:+19148637902">(914) 863-7902</a>.
			</p>
		</form>
	);
}
