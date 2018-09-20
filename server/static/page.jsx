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
      <TopDomains {...this.props} />
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
        <form onSubmit={this.onSubmit.bind(this)} id="lookup-shot-form">
          Look up shot:
          <input
          placeholder="shot ID, shot URL, or image URL"
          defaultValue={this.props.searchTerm}
          ref={input => this.input = input}
          id="lookup-shot-input"
          type="text" />
          <button type="submit">Look up</button>
        </form>
      </div>
      <hr />
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
          <th>URL</th>
          <td>{ this.props.shot.url }</td>
        </tr>
        <tr>
          <th>creation date</th>
          <td>{ this.props.shot.created }</td>
        </tr>
        <tr>
          <th>expiration time</th>
          <td>{ this.props.shot.expire_time}</td>
        </tr>
        { this.props.shot.block_type !== "none" ?
          <tr>
            <th>block type</th>
            <td>{ this.props.shot.block_type }</td>
          </tr>
          : null
        }
        { this.props.shot.deleted ?
          <tr>
            <th>deleted</th>
            <td>true</td>
          </tr>
          : null
        }
        <tr>
          <th colspan="2">shot JSON</th>
        </tr>
        <tr>
          <td colspan="2">
            <pre>{ JSON.stringify(this.props.shot.json, null, "  ") }</pre>
          </td>
        </tr>
      </tbody>
    </table>;
  }

  onBlockShot() {
    let input = document.querySelector("#block-shot-input");
    input.value = this.props.shot.shotId;
    input.focus();
  }

  onLookupDevice() {
    document.querySelector("#lookup-device-input").value = this.props.shot.deviceId;
    let form = document.querySelector("#lookup-device-form");
    form.querySelector("button").click();
    setTimeout(() => {
      form.scrollIntoView();
    }, 100);
  }
}

class LookUpDevice extends React.Component {
  render() {
    return <fieldset>
      <legend>Look up device</legend>

      <div>
        <form onSubmit={this.onSubmit.bind(this)} id="lookup-device-form">
          Look up device:
          <input
          placeholder="deviceId"
          defaultValue={this.props.searchTerm}
          ref={input => this.input = input}
          id="lookup-device-input"
          type="text" />
          <button type="submit">Look up</button>
        </form>
      </div>
      <hr />
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
    for (let shot of this.props.device.shots) {
      rows.push(<tr key={ shot.id }>
        <td>{ shot.id }</td>
        <td>
          <span title={ shot.url }>{ shot.title }</span>
          <span>{ shot.created }</span>
          { shot.block_type != "none" ? <strong>{ " " + shot.block_type }</strong> : null }
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
        { this.props.device.accountId ?
          <tr>
            <th>FxA account ID</th>
            <td>{ this.props.device.accountId }</td>
          </tr>
          : null
        }
        <tr>
          <th>creation date</th>
          <td>{ this.props.device.created }</td>
        </tr>
        <tr>
          <th>last login</th>
          <td>{ this.props.device.last_login }</td>
        </tr>
        <tr>
          <th>addon version</th>
          <td>{ this.props.device.addon_version }</td>
        </tr>
        <tr>
          <th>session count</th>
          <td>{ this.props.device.session_count }</td>
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
    document.querySelector("#lookup-shot-input").value = shot.id;
    let form = document.querySelector("#lookup-shot-form");
    form.querySelector("button").click();
    setTimeout(() => {
      form.scrollIntoView();
    }, 100);
  }

  onClickBlock(shot, event) {
    let input = document.querySelector("#block-shot-input");
    input.value = shot.id;
    input.focus();
  }

  onBlockDevice() {
    let input = document.querySelector("#block-device-input");
    input.value = this.props.device.deviceId;
    input.focus();
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
        id="block-device-input"
        type="text" />
        <button type="submit">Block</button>
      </form>
      <hr />
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
      <legend>block shot</legend>
      <form onSubmit={this.onSubmit.bind(this)}>
        Block shot:
        <input
        placeholder="shot ID, shot or image URL"
        ref={input => this.input = input}
        id="block-shot-input"
        type="text" />
        <select
        ref={select => this.select = select} required>
          <option value="">Select block reason</option>
          <option value="none">Clear block</option>
          <option value="dmca">DMCA</option>
          <option value="usererror">User error</option>
          <option value="illegal">Illegal</option>
          <option value="illegal-quarantine">Illegal + quarantine</option>
        </select>
        <button type="submit">Block</button>
      </form>
      <hr />
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

class TopDomains extends React.Component {
  render() {
    let defaultStartDate = new Date((new Date).getTime() - (1000*60*60*24*7)); // 7 days ago
    defaultStartDate = defaultStartDate.toISOString().split("T")[0];
    let defaultEndDate = (new Date()).toISOString().split("T")[0];
    let result = null;
    if (this.props.topDomains) {
      let rows = this.props.topDomains.map(row => {
        return <tr key={row.domain}>
          <td><code>{row.domain}</code></td>
          <td>{row.count}</td>
        </tr>;
      });
      result = <table className="topDomains">
        <tr>
          <th>Domain</th>
          <th>Count</th>
        </tr>
        { rows }
      </table>;
    }
    return <fieldset>
      <legend>top domains</legend>
      <form onSubmit={this.onSubmit.bind(this)}>
        <div>
          <label for="includeBeta">
            Include beta channel in search:
            <input type="checkbox" id="includeBeta" ref={input => this.includeBeta = input} /></label>
        </div>
        <div>
          <label for="startDate">
            Start date:
            <input type="text" defaultValue={ defaultStartDate } placeholder="YYYY-MM-DD" id="startDate" ref={input => this.startDate = input} />
          </label>
        </div>
        <div>
          <label for="endDate">
            End date:
            <input type="text" defaultValue={ defaultEndDate } placeholder="YYYY-MM-DD" id="endDate" ref={input => this.endDate = input} />
          </label>
        </div>
        <div>
          <label for="numberOfDomains">
            Number of domains:
            <input type="text" defaultValue="100" id="numberOfDomains" ref={input => this.numberOfDomains = input} />
          </label>
        </div>
        <div>
          <label for="requiredDomains">
            Do not show a domain if it has less requests than this:
            <input type="text" defaultValue="100" id="requiredDomains" ref={input => this.requiredDomains = input} />
          </label>
        </div>
        <button type="submit">Query</button>
      </form>
      { this.props.topDomainsInformation }
      { result }
    </fieldset>;
  }

  async onSubmit() {
    event.preventDefault();
    let includeBeta = !!this.includeBeta.checked;
    let startDate = this.startDate.value;
    let endDate = this.endDate.value;
    let numberOfDomains = parseInt(this.numberOfDomains.value, 10);
    let requiredDomains = parseInt(this.requiredDomains.value, 10);
    model.topDomainsInformation = "Querying server...";
    render();
    let resp = await fetch("/query-top-domains", {
      body: JSON.stringify({includeBeta, startDate, endDate, numberOfDomains, requiredDomains}),
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
      model.topDomainsInformation = "Errored";
      render();
      return;
    }
    let json = await resp.json();
    model.topDomains = json.topDomains;
    model.topDomainsInformation = null;
    render();
  }
}

function render() {
  let page = <Page {...model} />;
  ReactDOM.render(page, document.getElementById("container"));
}

render();
