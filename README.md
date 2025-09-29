# ytdt-claims-console

This is a [Next.js](https://nextjs.org) frontend for [`ytdt-claims-pipeline`](https://github.com/ceduth/ytdt-claims-pipeline).

![](./app/images/screenshot-1.png)
<div style="display:flex; gap:5px;">
  <img src="./app/images/screenshot-2.png" alt="screenshot-2" style="height:200px;width:33%; object-fit:cover;"/>
  <img src="./app/images/screenshot-3.png" alt="screenshot-3" style="height:200px;width:33%; object-fit:cover;"/>
  <img src="./app/images/screenshot-4.png" alt="screenshot-3" style="height:200px;width:33%; object-fit:cover;"/>
</div>


## Getting Started


1. Start the backend. RTD at [`ytdt-claims-pipeline`](https://github.com/ceduth/ytdt-claims-pipeline)
2. Start ML enrichment sub-pipeline [`YT-Validator`](https://github.com/matthew-jf/YT-Validator) 
3. Run the development server:

```bash
PORT=3001 \
NEXT_PUBLIC_API_URL=http://localhost:3000 \
npm run dev
```

Optionally reading envs from file:
```shell
cp .env.example .env.local
```

3. Point your browser at [http://localhost:3002](http://localhost:3002).



