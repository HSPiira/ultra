from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Hospital',
            fields=[
                ('id', models.CharField(primary_key=True, max_length=25, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(max_length=10)),
                ('is_deleted', models.BooleanField(default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('name', models.CharField(max_length=200)),
                ('address', models.TextField(blank=True)),
                ('contact_person', models.CharField(blank=True, max_length=100)),
                ('phone_number', models.CharField(blank=True, max_length=50)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('website', models.URLField(blank=True)),
                (
                    'branch_of',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='branches',
                        to='providers.hospital',
                    ),
                ),
            ],
            options={'db_table': 'hospitals'},
        ),
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('id', models.CharField(primary_key=True, max_length=25, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(max_length=10)),
                ('is_deleted', models.BooleanField(default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('name', models.CharField(max_length=200)),
                ('specialization', models.CharField(blank=True, max_length=200)),
                ('license_number', models.CharField(blank=True, max_length=100)),
                ('qualification', models.CharField(blank=True, max_length=500)),
                ('phone_number', models.CharField(blank=True, max_length=50)),
                ('email', models.EmailField(blank=True, max_length=254)),
                (
                    'hospital',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='doctors',
                        to='providers.hospital',
                    ),
                ),
            ],
            options={'db_table': 'doctors'},
        ),
    ]


