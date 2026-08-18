using Backend.Data;
using Backend.Models;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItemsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/items
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DataSourceLoadOptions loadOptions)
        {
            var source = _context.Items.AsQueryable();
            return Ok(await DataSourceLoader.LoadAsync(source, loadOptions));
        }

        // POST: api/items
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Item item)
        {
            _context.Items.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        // PUT: api/items/5 OR api/items (DevExtreme passes key in URL or body)
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Item updatedItem)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();

            if (updatedItem.Name != null)
                item.Name = updatedItem.Name;

            if (updatedItem.Price.HasValue)
                item.Price = updatedItem.Price.Value;

            await _context.SaveChangesAsync();

            return Ok(item);
        }

        // DELETE: api/items/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}