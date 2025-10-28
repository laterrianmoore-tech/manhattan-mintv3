// app/booking/authorize/page.tsx
export default function AuthorizeJobber() {
  const clientId = process.env.NEXT_PUBLIC_JOBBER_CLIENT_ID!;
  const redirect = encodeURIComponent(process.env.NEXT_PUBLIC_JOBBER_REDIRECT!);
  const url = `https://api.getjobber.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&response_type=code&scope=public`;
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Connect Jobber</h1>
      <a href={url} className="mt-4 inline-block rounded bg-black px-4 py-2 text-white">Authorize</a>
    </main>
  );
}
