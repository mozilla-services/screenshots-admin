let model = {
  lastError: null,
  lookingUpShot: {},
  lookingUpDevice: {},
};

class Page extends React.Component {
  render() {
    return <div>
      { this.props.lastError ? <ErrorMessage error={this.props.lastError} /> : null }
      <LookUpShot {...this.props.lookingUpShot} />
      <LookUpDevice {...this.props.lookingUpDevice} />
      <BlockDevice {...this.props} />
      <BlockShot {...this.props} />
    </div>;
  }
}

class ErrorMessage extends React.Component {
  render() {
    let description = this.props.error.description;
    let body = this.props.error.body;
    let props = Object.assign({}, this.props.error);
    delete props.description;
    delete props.body;
    return <div>
      <h1>Error</h1>
      <div>{description}</div>
      <pre>{JSON.stringify(props, null, "  ")}</pre>
      <pre style={{wordBreak: "normal"}}>{body}</pre>
    </div>;
  }
}

class LookUpShot extends React.Component {
  render() {
    return <fieldset>
      <legend>Look up shot</legend>

      <div>
        <form onSubmit={this.onSubmit.bind(this)}>
          Look up shot:
          <input
          placeholder="shot ID, shot URL, or image URL"
          defaultValue={this.props.searchTerm}
          ref={input => this.input = input}
          type="text" />
          <button type="submit">Look up</button>
        </form>
      </div>
      { this.props.notFound ? <div>No shot found with term {this.props.searchTerm}</div> : null }
      { this.props.shotInformation ? <ShotInformation shot={this.props.shotInformation} /> : null }
      { this.props.shotSearching ? "Searching..." : null }
    </fieldset>;
  }

  async onSubmit(event) {
    event.preventDefault();
    let searchTerm = this.input.value;
    model.lookingUpShot.notFound = false;
    model.lookingUpShot.shotInformation = null;
    model.lookingUpShot.shotSearching = true;
    render();
    let resp = await fetch(`/lookup-shot?term=${encodeURIComponent(searchTerm)}`);
    model.lookingUpShot.shotSearching = false;
    if (resp.status === 404) {
      model.lookingUpShot.notFound = true;
      render();
      return;
    }
    if (! resp.ok) {
      let body = await resp.text();
      model.lastError = {
        description: "Error looking up shot:",
        status: resp.status,
        statusText: resp.statusText,
        body: body,
      };
      render();
      return;
    }
    let results = await resp.json();
    model.lookingUpShot.shotInformation = results;
    render();
  }
}

class ShotInformation extends React.Component {
  render() {
    return <table>
      <tbody>
        <tr>
          <th>shot ID</th>
          <td>
            { this.props.shot.shotId }
            <button onClick={this.onBlockShot.bind(this)}>block</button>
          </td>
        </tr>
        <tr>
          <th>deviceId</th>
          <td>
            { this.props.shot.deviceId }
            <button onClick={this.onLookupDevice.bind(this)}>lookup</button>
          </td>
        </tr>
        <tr>
          <th>title</th>
          <td>{ this.props.shot.title }</td>
        </tr>
        <tr>
          <th>creation date</th>
          <td>{ this.props.shot.created }</td>
        </tr>
        <tr>
          <td colspan="2">
            <div>Shot JSON:</div>
            <pre>{ JSON.stringify(this.props.shot.json, null, "  ") }</pre>
          </td>
        </tr>
      </tbody>
    </table>;
  }

  onBlockShot() {
    // FIXME: implement
  }

  onLookupDevice() {
    // FIXME: implement
  }
}

class LookUpDevice extends React.Component {
  render() {
    return <fieldset>
      <legend>Look up device</legend>

      <div>
        <form onSubmit={this.onSubmit.bind(this)}>
          Look up device:
          <input
          placeholder="deviceId"
          defaultValue={this.props.searchTerm}
          ref={input => this.input = input}
          type="text" />
          <button type="submit">Look up</button>
        </form>
      </div>
      { this.props.notFound ? <div>No device found with ID {this.props.searchTerm}</div> : null }
      { this.props.deviceInformation ? <DeviceInformation device={this.props.deviceInformation} /> : null }
      { this.props.deviceSearching ? "Searching..." : null }
    </fieldset>;
  }

  async onSubmit(event) {
    event.preventDefault();
    let deviceId = this.input.value;
    model.lookingUpDevice.notFound = false;
    model.lookingUpDevice.deviceInformation = null;
    model.lookingUpDevice.deviceSearching = true;
    render();
    let resp = await fetch(`/lookup-device?deviceId=${encodeURIComponent(deviceId)}`);
    model.lookingUpDevice.deviceSearching = false;
    if (resp.status === 404) {
      model.lookingUpDevice.notFound = true;
      render();
      return;
    }
    if (! resp.ok) {
      let body = await resp.text();
      model.lastError = {
        description: "Error looking up device:",
        status: resp.status,
        statusText: resp.statusText,
        body: body,
      };
      render();
      return;
    }
    let results = await resp.json();
    model.lookingUpDevice.deviceInformation = results;
    render();
  }
}

class DeviceInformation extends React.Component {
  render() {
    let rows = [];
    console.log("my props", this.props);
    for (let shot of this.props.device.shots) {
      rows.push(<tr key={ shot.id }>
        <td>{ shot.id }</td>
        <td>
          <span>{ shot.title }</span>
          <span>{ shot.created }</span>
          <button onClick={this.onClickLookUp.bind(this, shot)}>lookup</button>
          <button onCLick={this.onClickBlock.bind(this, shot)}>block</button>
        </td>
      </tr>);
    }
    return <table>
      <tbody>
        <tr>
          <th>deviceId</th>
          <td>
            { this.props.device.deviceId }
            <button onClick={this.onBlockDevice.bind(this)}>block</button>
          </td>
        </tr>
        <tr>
          <th>creation date</th>
          <td>{ this.props.device.created }</td>
        </tr>
        <tr>
          <th>number of shots</th>
          <td>{ this.props.device.shotCount }</td>
        </tr>
        { rows }
      </tbody>
    </table>;
  }

  onClickLookUp(shot, event) {
    // FIXME: implement
  }

  onClickBlock(shot, event) {
    // FIXME: implement
  }

  onBlockDevice() {
    // FIXME: implement
  }
}

class BlockDevice extends React.Component {
  render() {
    return <fieldset>
      <legend>block device</legend>
      <form onSubmit={this.onSubmit.bind(this)}>
        Block deviceId:
        <input
        placeholder="deviceId"
        ref={input => this.input = input}
        type="text" />
        <button type="submit">Block</button>
      </form>
      { this.props.blockDeviceInformation ? this.props.blockDeviceInformation : null }
    </fieldset>;
  }

  async onSubmit(event) {
    event.preventDefault();
    let deviceId = this.input.value;
    model.blockDeviceInformation = "executing...";
    render();
    let resp = await fetch("/block-device", {
      body: JSON.stringify({deviceId}),
      headers: {"content-type": "application/json"},
      method: "POST",
    });
    if (!resp.ok) {
      let body = await resp.text();
      model.lastError = {
        description: "Error looking up device:",
        status: resp.status,
        statusText: resp.statusText,
        body: body,
      };
      model.blockDeviceInformation = "Errored";
      render();
      return;
    }
    model.blockDeviceInformation = `Blocked deviceId ${deviceId}`;
    render();
  }
}

class BlockShot extends React.Component {
  render() {
    return <fieldset>
      <legend>block device</legend>
      <form onSubmit={this.onSubmit.bind(this)}>
        Block deviceId:
        <input
        placeholder="shot ID, shot or image URL"
        ref={input => this.input = input}
        type="text" />
        <select
        ref={select => this.select = select} required>
          <option value="">Select block reason</option>
          <option value="dmca">DMCA</option>
          <option value="usererror">User error</option>
          <option value="illegal">Illegal</option>
          <option value="illegal-quarantine">Illegal + quarantine</option>
        </select>
        <button type="submit">Block</button>
      </form>
      { this.props.blockShotInformation ? this.props.blockShotInformation : null }
    </fieldset>;
  }

  async onSubmit(event) {
    event.preventDefault();
    let term = this.input.value;
    let reason = this.select.options[this.select.selectedIndex].value;
    if (!reason) {
      model.blockShotInformation = "Reason is required";
      render();
      return;
    }
    model.blockShotInformation = "executing..." + reason;
    render();
    let resp = await fetch("/block-shot", {
      body: JSON.stringify({term, reason}),
      headers: {"content-type": "application/json"},
      method: "POST",
    });
    if (!resp.ok) {
      let body = await resp.text();
      model.lastError = {
        description: "Error looking up shot:",
        status: resp.status,
        statusText: resp.statusText,
        body: body,
      };
      model.blockShotInformation = "Errored";
      render();
      return;
    }
    let shotId = await resp.text();
    model.blockShotInformation = `Blocked shot ${shotId} from ${term}`;
    render();
  }
}

function render() {
  let page = <Page {...model} />;
  ReactDOM.render(page, document.getElementById("container"));
}

render();
