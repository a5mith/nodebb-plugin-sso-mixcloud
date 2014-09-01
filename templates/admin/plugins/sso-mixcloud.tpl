<h1><i class="fa fa-headphones"></i> MixCloud Authentication</h1>
<hr />

<form class="sso-mixcloud">
	<div class="alert alert-warning">
		<p>
			Create a <strong>MixCloud Application</strong> via the
			<a href="http://www.mixcloud.com/developers/">Developers Pages</a> and paste
			your application details here.
		</p>
		<br />
		<input type="text" name="id" title="Client ID" class="form-control input-lg" placeholder="Client ID"><br />
		<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret">
		<p class="help-block">
			The appropriate "Redirect URI" is your forums URL with `/auth/mixcloud/callback` appended to it.
		</p>
	</div>
</form>

<button class="btn btn-lg btn-primary" type="button" id="save">Save</button>

<script>
	require(['settings'], function(Settings) {
		Settings.load('sso-mixcloud', $('.sso-mixcloud'));

		$('#save').on('click', function() {
			Settings.save('sso-mixcloud', $('.sso-mixcloud'));
		});
	});
</script>