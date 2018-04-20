let model = {};

class Page extends React.Component {
  render() {
    return <span>I am a page</span>;
  }
}

function render() {
  let page = <Page {...model} />;
  ReactDOM.render(page, document.getElementById("container"));
}

render();
