import { MemcachePool } from "./memcachePool.ts";

async function memcache() {
  const pool = new MemcachePool({ size: 5 });

  await pool.set("users", "2", "John");
  const user2 = await pool.get("users", "2", { hit: true, value: true });
  await pool.setJson("users", "1", { name: "Jane" });
  const user1 = await pool.getJson("users", "1");
  console.log(user1);
  console.log(user2);
  // const client = new MemcacheClient()
  // await client.connect()
  // const res = await client.set('users', '1', 'John')
  // console.log(res)
  // const user = await client.get('users', '1', {
  //     hit: true,
  //     value: true
  // })
  // console.log(user)
  // await client.setList('users', [{name: 'John'}, {name: 'Jane'}])
  // const users = await client.getList('users')
  // console.log(users)

  console.log("Connected to memcache");
}

if (import.meta.main) {
  await memcache();
}
