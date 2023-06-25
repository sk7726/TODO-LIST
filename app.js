const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const dovenv = require("dotenv");

dovenv.config();

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set('strictQuery', true);
mongoose.connect(process.env.DB_URI);

const itemSchema = {
  name: String
}

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your ToDOList"
});
const item2 = new Item({
  name: "Hit the + button to add new item"
});
const item3 = new Item({
  name: "Hit the check-box to delete item"
});

const defaultItems = [item1, item2, item3]
const listSchema = {
  name: String,
  item: [itemSchema]
}
const List = new mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find((err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved the items");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", { listTitle: day, newListItems: items });
    }
  })

});


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  })

  if (listName === date.getDate()) {
    item.save();
    res.redirect('/');
  }
  else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.item.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }
});


app.post('/delete', (req, res) => {
  const checkedItem = req.body.checkbox;
  const customCheckedList = req.body.list;

  if (customCheckedList === date.getDate()) {
    Item.findByIdAndRemove(checkedItem, (err) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log('item id ' + checkedItem + ' sucessfully removed');
        res.redirect('/');
      }
    });
  }
  else {
    List.findOneAndUpdate({name: customCheckedList}, {$pull: {item: {_id: checkedItem}}}, (err) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log('item id ' + checkedItem + ' sucessfully removed');
        res.redirect('/' + customCheckedList);
      }
    });
  }
});


app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          item: defaultItems
        })
        list.save();
        res.redirect('/' + customListName);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.item });
      }
    }
  })




})

app.listen(process.env.PORT, function () {
  console.log("Server started on port 3000");
});
